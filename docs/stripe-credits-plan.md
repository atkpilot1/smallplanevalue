# Stripe credits — implementation plan

Hosted Stripe Checkout after three lifetime free valuations. Two one-time SKUs: **$24 for 1** or **$75 for 5**. Form fields must survive the leave-and-return to Checkout.

**Status:** Plan only. Auth steps 1–3 are done. Do not implement until this plan is accepted.

## Locked decisions

| Topic | Decision |
|---|---|
| Checkout UI | Hosted Stripe Checkout (leave the site). Not Embedded Checkout, not Payment Element. |
| How the user picks a SKU | Two buttons on **our** paywall / account dialog. Each button creates a Checkout Session with one Price. Stripe’s page does not present both products. |
| SKUs | One-time `mode: 'payment'`. Price A: $24 / 1 credit. Price B: $75 / 5 credits. No subscriptions, no Customer Portal in this work. |
| Free allowance | **3 lifetime** per account, not monthly. Replace the unused `VALUATION_LIMITS_ENABLED` / `clientId`-per-month path; do not revive it. |
| Credit model | Keep `profiles.valuation_count` (successful runs). Add `profiles.credit_balance` (purchased, unused). Allowed if `valuation_count < 3` **or** `credit_balance > 0`. Free slots are consumed first. |
| When to consume | **Check before** Anthropic (402, no LLM spend). **Consume after** a successful result (Anthropic 500 does not consume). Same contract as today’s increment. |
| Server as source of truth | `/api/valuate` returns **402** `{ code: 'credits_required' }` when the account cannot run. The UI does not honor-system a client flag. |
| Form survival | Persist the valuation form with VueUse `useLocalStorage` (`spv_valuation_form`). Hydrate on mount. **Done** (ahead of Stripe). |
| After login or after pay | Do **not** auto-submit. Unlock the button; they click **Get honest valuation** again. |
| Realtime | **No Supabase subscriptions.** Refetch the profile after return / account open. Optional short poll (a few seconds) if the webhook is late. |
| Webhook | `checkout.session.completed` with `payment_status === 'paid'` grants credits. Idempotent on Stripe event id (and session id). Do not also grant on `charge.succeeded`. |
| Tests | Offline. Mock `api.stripe.com` the same way we mock Anthropic. Sign and POST fake webhooks ourselves. **No Stripe test secret in Playwright. No live Checkout in CI.** |

## Answers to the open questions

### Can hosted Checkout support $24 vs $75 for five?

Yes. Stripe Checkout is one session → one set of `line_items`. The user chooses on our page:

1. **1 valuation — $24** → `POST /api/checkout` `{ sku: 'single' }` → session with `STRIPE_PRICE_SINGLE`
2. **5 valuations — $75** → `{ sku: 'pack' }` → session with `STRIPE_PRICE_PACK`

Then `window.location = session.url`. Prefill `customer_email` from the signed-in user. Put `user_id` and `credits` (`1` or `5`) in session `metadata` (and `client_reference_id = user_id`).

A single Checkout Session cannot cleanly offer “pick exactly one of these two prices.” Two buttons is the simple path.

### Does `/api/valuate` already fail without credits?

**Login yes, credits no.**

Today:

- No JWT → **401** (`requireAuthUser`). That stays.
- `VALUATION_LIMITS_ENABLED` is **false**, so the old 402 / monthly `clientId` branch never runs.
- After a successful LLM result we increment `profiles.valuation_count` and write `usage_events`. There is no remaining-credit check.

We will add an account-based check **before** the prompt is built, and keep consume **after** success.

```
requireAuthUser
  → assertCanValuate(user.id)     // 402 if no free slot and credit_balance === 0
  → Anthropic + post-process
  → consumeValuation(user.id)     // increment count; decrement credit_balance only if this run was paid
```

`GET /api/valuation-access` is still the old clientId helper. Do not use it for the paywall. Add a session-authenticated read (or just read `profiles` from the client the way we already read `valuation_count`).

### Do we need Supabase subscriptions?

No. Credits change in two places only: consume on valuate, grant on webhook (and optionally on a confirm endpoint). After Checkout the browser comes back to our origin and refetches. If the webhook is a second late, poll `profiles` a few times or fulfill via `POST /api/stripe/confirm` with the `session_id` from `success_url` (same idempotent grant as the webhook).

### Will the user lose the form?

Yes, unless we persist it. Hosted Checkout is a full navigation to `checkout.stripe.com`. `useState` in `useValuationForm` is memory-only today. Login is an overlay on the same page, so it does not lose fields; Stripe will.

Persist continuously (not only on “Buy”), hydrate on client mount. `success_url` / `cancel_url` land back on the valuate tab. Fields restore from `spv_valuation_form`. Playwright already isolates `localStorage` per test.

Lookup prefills keep writing into the same state; after hydrate, a lookup still overwrites make/model/year as it does now.

---

## Schema

```text
profiles
  user_id
  valuation_count      -- keep; lifetime successful runs
  credit_balance       -- new; purchased unused; default 0
  created_at / updated_at

stripe_events
  event_id text PK     -- evt_...
  session_id text UNIQUE
  user_id
  credits_granted
  created_at
```

RPCs (service role only):

- `assert_can_valuate(p_user_id)` → remaining free, `credit_balance`, `allowed`
- `consume_valuation(p_user_id)` → increment `valuation_count`; if the new count is `> 3`, decrement `credit_balance` (this run used a paid credit)
- `grant_credits(p_user_id, p_credits, p_session_id)` → add to `credit_balance`; no-op if `session_id` already granted

Buying before the free three are used is fine: paid credits sit until free slots are gone.

A double-submit race (two tabs both see `valuation_count = 2`) can theoretically yield a fourth free run. Accept that at this volume; do not add a reservation row.

---

## Product / UI

**Account dialog**

- Replace “Valuations run: N” as the only number with something like:
  - Free remaining: `max(0, 3 − valuation_count)`
  - Paid credits: `credit_balance`
  - Optional: lifetime runs still visible
- Two buy buttons always available (top-up before hitting zero).

**Paywall (logged-in submit, 402)**

- Same overlay pattern as login/account.
- Copy: used the 3 free valuations.
- Buttons: **1 valuation — $24**, **5 valuations — $75**.
- Persist is already on; redirect to Checkout.
- 401 still opens login (unchanged).

**Return from Stripe**

- `success_url`: `/?tab=val&paid=1&session_id={CHECKOUT_SESSION_ID}`
- `cancel_url`: `/?tab=val&paid=0`
- Show a short “Credits added” / “Checkout canceled” state if query params are present.
- Do not auto-valuate.

**Env (server only, never `public`)**

```text
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_SINGLE=
STRIPE_PRICE_PACK=
```

Local/CI can use dummy values; Playwright never calls Stripe.

---

## Server routes

| Route | Role |
|---|---|
| `POST /api/checkout` | Auth required. Body `{ sku: 'single' \| 'pack' }`. Create Checkout Session, return `{ url }`. |
| `POST /api/stripe/webhook` | Raw body + `Stripe-Signature`. Verify, grant on `checkout.session.completed`. |
| `POST /api/stripe/confirm` | Auth required. Body `{ session_id }`. Retrieve session from Stripe (or mocked), grant if paid. Same `grant_credits` as the webhook. Optional but recommended so return is snappy. |
| `POST /api/valuate` | 402 when not allowed; consume after success. |

Install `stripe` on the **server** only.

Webhook handler must use the **raw** body. If Nuxt parses JSON first, `constructEvent` will fail.

---

## Playwright — fully offline

Do **not** put a Stripe test key in Playwright. Do **not** drive `checkout.stripe.com`. Do **not** use Stripe CLI in CI.

Treat Stripe like Anthropic: the Nuxt handler is real, local Supabase is real, the outbound HTTP is mocked.

### What Playwright needs

| Need | How |
|---|---|
| Credit gate without money | Service-role REST: set `valuation_count` / `credit_balance` on `profiles`. Submit. Assert 402 vs success. |
| Checkout Session create | `playwright-backend-mocks`: intercept `api.stripe.com` `POST /v1/checkout/sessions`, return `{ id: 'cs_test_…', url: 'https://checkout.stripe.com/c/pay/cs_test_…' }`. Assert we navigate toward that URL (or intercept and stop). |
| Return from Checkout | `page.goto` our `success_url` / `cancel_url`. Form still filled from `spv_valuation_form`. |
| Webhook grant | Playwright `request.post('/api/stripe/webhook', { data: rawPayload, headers: { 'stripe-signature': signed } })`. Then `fetchProfile`. |
| Confirm grant | Mock `GET /v1/checkout/sessions/:id`, POST `/api/stripe/confirm`. |
| Signing | Node `crypto` HMAC, or `stripe.webhooks.generateTestHeaderString({ payload, secret })`. Either is offline. The Stripe **secret used to sign** is whatever `STRIPE_WEBHOOK_SECRET` the Nuxt server has in E2E (a dummy `whsec_test_e2e`). |

Stripe-Signature format (if we HMAC ourselves):

```text
signed_payload = `${timestamp}.${rawBody}`
v1 = HMAC_SHA256(STRIPE_WEBHOOK_SECRET, signed_payload)
header = `t=${timestamp},v1=${v1}`
```

No live Stripe client in test code. The `stripe` package in the test process is optional and only for that header helper.

### Suggested cases

**Gate (no Stripe mock required)**

- Signed in, `valuation_count = 0`: three successful valuates; fourth is 402; Anthropic is not called on the fourth.
- Anthropic 500 on the third free: count stays 2.
- `valuation_count = 3`, `credit_balance = 1`: valuate succeeds; balance 0; count 4.
- `valuation_count = 3`, `credit_balance = 0`: UI paywall; no `POST /api/valuate` body that returns 200 (or 402 handled in UI); no Anthropic.
- Two accounts: independent free + paid balances.

**Form persist (done)**

- Fill make/model/SMOH, reload: fields still there.
- Fill, `goto` success URL (simulate Checkout return): fields still there.
- Do not auto-submit after return.

**Checkout + webhook**

- Buy single: mocked session create → we send the user toward Stripe’s URL.
- Signed `checkout.session.completed` for user A, `credits: 1` → `credit_balance += 1`.
- Same `event_id` / `session_id` again → balance unchanged (idempotent).
- Webhook for user B does not credit A.
- Bad signature → 400, no grant.
- After grant, fourth valuation succeeds; account dialog shows the new remaining.

**Out of scope for CI**

- Real test cards, 3DS, Stripe-hosted DOM.
- Optional local-only smoke with Stripe CLI / test mode is fine; do not block merge on it.

---

## Implementation steps

Each step ships with Playwright before the next starts. Same rules as auth: do not stub `/api/*` in the browser; mock only Anthropic and (from step 5) `api.stripe.com`.

### Step 4 — 3-free / paid-balance gate (no Stripe)

- Form persist is already shipped (`spv_valuation_form` + VueUse).
- Migration: `credit_balance`, consume/assert RPCs.
- `/api/valuate` 402 `credits_required`; consume after success.
- Account dialog shows free remaining + paid credits.
- Paywall dialog with the two price buttons **visible but not wired** (or wired to a “coming soon” no-op). Prefer visible-but-disabled until step 5 so snapshots are honest.
- Tests: persist, 402 on fourth, paid balance works, 500 does not consume, accounts independent.

### Step 5 — Stripe Checkout + webhook

- `stripe` server dependency, env, two Price IDs.
- `POST /api/checkout`, webhook, optional confirm.
- Wire the two buttons; redirect; success/cancel return.
- Playwright: mock session create, signed webhooks, confirm, form still filled, grant then valuate.

### Done when

- Fourth valuation is 402 until credits exist.
- Hosted Checkout is the only pay path.
- Webhook (and confirm) grant is idempotent.
- Full suite green with Stripe HTTP mocked and webhooks signed locally.
- No Supabase realtime.

## Out of scope

- Subscriptions, trials, Customer Portal, invoices.
- Stripe Tax, promo codes (can add later on the same Session create).
- Gating lookup / comps / checklist / parse.
- Refunds / clawing back a consumed credit.
- Live Stripe in CI.
