# Stripe credits — implementation plan

Hosted Stripe Checkout after three lifetime free valuations. Two one-time SKUs: **$24 for 1** or **$75 for 5**. Form fields must survive the leave-and-return to Checkout.

**Status:** Steps 4–5 implemented. Form persist was already shipped. Playwright mocks `api.stripe.com` and signs webhooks locally.

## Locked decisions

| Topic | Decision |
|---|---|
| Checkout UI | Hosted Stripe Checkout (leave the site). Not Embedded Checkout, not Payment Element. |
| How the user picks a SKU | Two buttons on **our** paywall / account dialog. Each button creates a Checkout Session with one Price. Stripe’s page does not present both products. |
| SKUs | One-time `mode: 'payment'`. Price A: $24 / 1 credit. Price B: $75 / 5 credits. No subscriptions, no Customer Portal in this work. |
| Free allowance | **3 lifetime** per account, not monthly. The old `clientId` monthly path (`GET /api/valuation-access`) is gone. Do not revive it. |
| Credit model | Keep `profiles.valuation_count` (successful runs). Add `profiles.credit_balance` (purchased, unused). Allowed if `valuation_count < 3` **or** `credit_balance > 0`. Free slots are consumed first. |
| When to consume | **Atomic claim before** Anthropic (`consume_valuation` `UPDATE … WHERE`). 402 if the row does not change. **Refund** on Anthropic/parse failure so a 500 does not keep the slot. |
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

**Yes.** Login and credits are both server-enforced.

```
requireAuthUser                  // 401 without a JWT
  → consumeValuation(user.id)    // service-role RPC; 402 if allowed !== true
  → Anthropic + post-process
  → on failure: refundValuation  // undo the claim; Anthropic 500 does not keep the slot
```

The browser reads `profiles` (own row) for the account dialog. It does not decide whether a valuation may run.

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

Credit writes are `LANGUAGE sql` functions, service-role RPC only (`REVOKE` from anon/authenticated). The increment is `column = column + 1` in one `UPDATE`.

- `consume_valuation(user, free)` → `UPDATE … WHERE` remaining; `allowed: false` if no row changes
- `refund_valuation(user, free)` → undo one claim
- `grant_credits` → insert `stripe_events` then add to `credit_balance` in one statement; no-op if `event_id` / `session_id` already exists

Buying before the free three are used is fine: paid credits sit until free slots are gone.

A double-submit race is closed by the `UPDATE … WHERE`. Do not add a Playwright case for that race (it would be flaky).

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
- Cancel (`paid=0`) shows “Checkout canceled.” Success (`paid=1`) shows the credits-added note immediately. `?paid=1` alone does not grant credits; grant still goes through `POST /api/stripe/confirm` or the webhook.
- Do not auto-valuate.

**Env (server only, never `public`)**

```text
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_SINGLE=
STRIPE_PRICE_PACK=
```

No in-code defaults. The Nitro process exits on startup if these are unset. Playwright and `start:e2e` load placeholders from `.env.test`.

---

## Server routes

| Route | Role |
|---|---|
| `POST /api/checkout` | Auth required. Body `{ sku: 'single' \| 'pack' }`. Create Checkout Session, return `{ url }`. |
| `POST /api/stripe/webhook` | Raw body + `Stripe-Signature`. Verify, grant on `checkout.session.completed`. |
| `POST /api/stripe/confirm` | Auth required. Body `{ session_id }`. Retrieve session from Stripe (or mocked), grant if paid. Same `grant_credits` as the webhook. Optional but recommended so return is snappy. |
| `POST /api/valuate` | 402 when the atomic claim fails; refund if the LLM/parse throws. |

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

### Step 4 — 3-free / paid-balance gate (no Stripe) — done

- Form persist is already shipped (`spv_valuation_form` + VueUse).
- Migration `0007`: `credit_balance` + `stripe_events` + consume/refund/grant service-role SQL functions.
- `/api/valuate` 402 `credits_required`; atomic claim before Anthropic, refund on failure.
- Account dialog shows free remaining + paid credits.
- Tests: persist, 402 on fourth, paid balance works, 500 does not consume, accounts independent.

### Step 5 — Stripe Checkout + webhook — done

- `stripe` server dependency, env, two Price IDs.
- `POST /api/checkout`, webhook, confirm.
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
