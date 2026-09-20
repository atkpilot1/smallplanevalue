# Auth, login UI, and valuation credits — implementation plan

Add Supabase email OTP so a visitor can sign in, see account state, and (in later steps) be required to be logged in before a valuation. Stripe and the “3 free then pay” limit are **not** in this work.

Work in three sequential steps. Each step ships with Playwright coverage before the next starts.

**Status:** Steps 1–3 are implemented. The 3-free / paid-balance gate and Stripe Checkout are in [stripe-credits-plan.md](./stripe-credits-plan.md).

## Locked decisions

| Topic | Decision |
|---|---|
| Auth method | Email OTP (6-digit code). Sign-up and sign-in are the same flow. |
| Nav control | Keep **Look up my plane**. Add a second control to its right: **Sign In** when logged out, **Manage Account** when logged in. |
| Login popup | Opened by **Sign In**. Email → send code → enter OTP → session. |
| Account popup | Opened by **Manage Account**. Shows email, sign out, and a credits/status area that can stay “coming soon” until the counter exists. |
| After OTP from a valuation attempt | Do **not** auto-submit. Unlock the button / let them click **Get honest valuation** themselves. |
| What is gated, and when | Step 1: nothing. Step 2: must be logged in to run `/api/valuate`. Step 3: persist a per-account count only — **do not enforce a remaining-credits limit**. |
| Other tools | Lookup, comps, checklist, listing paste, sold, feedback stay ungated. |
| Stripe | Out of scope. Leave a visible but inactive “buy more” affordance in the account popup if it helps later, or omit it until checkout exists. |

## Rules

- **Tests stay strong.** Do not stub `/api/*` in the browser. Mock only Anthropic (existing `playwright-backend-mocks` setup). Drive real Nuxt handlers and local Supabase.
- **Do not weaken existing valuation cases** when login becomes required. Teach those tests to sign in (or use a shared auth helper) instead of skipping or stubbing valuate.
- **Snapshots will change on purpose** in step 1 (`nav` gains a button). Update that snapshot after the UI is right; do not use it as cover for unrelated chrome drift.
- **localStorage `spv_client_id` / `usage_events` stay as they are** until step 3 decides how they relate to `auth.users`. Do not remove the existing usage-event write in step 1–2 unless a test forces it.

## Current baseline (what we are extending)

- Nav: logo, mid links, gold **Look up my plane** CTA. No auth UI.
- Valuate accepts optional `clientId` / `email` and can write `usage_events`. Account credits (3 free, then paid) are the gate — see [stripe-credits-plan.md](./stripe-credits-plan.md).
- Server talks to Supabase with the **anon** key via REST helpers. There is no Supabase Auth client, no session, no `profiles` table.
- Playwright already hits live local Supabase for `aircraft` (lookup) and `usage_events` (one valuation test). See [Playwright vs local Supabase](#playwright-vs-local-supabase) below.

---

## Step 1 — OTP, nav button, popups (no gating)

Goal: a real session the user can open and close. Valuations still run for anyone.

### Product

- Logged out: **Sign In** in the nav (right of the CTA) opens the login popup.
- Login popup: email, send code, OTP field, verify. Errors stay in the popup (invalid email, bad/expired code).
- Logged in: the same slot reads **Manage Account** and opens the account popup (email + sign out).
- Refresh keeps the session (Supabase client persistence).
- Sign out returns the nav to **Sign In** and closes the popup.
- `/api/valuate` is unchanged. No login check.

### Engineering

- Add `@supabase/supabase-js` (or `@nuxtjs/supabase` if it stays thin). Browser client uses the public URL + anon key already in `runtimeConfig`.
- Composable `useAuth()`: session, user, `signInWithOtp`, `verifyOtp`, `signOut`, popup open/close state.
- Components: nav account control, login dialog, account dialog. Use roles/labels the tests can see (`Sign In`, `Manage Account`, email, code, verify, sign out). Prefer a dialog role over a custom overlay with no name.
- Local Auth: Inbucket/Mailpit is already on `:54324`. Confirm `supabase/config.toml` `[auth]` `site_url` / `additional_redirect_urls` include the E2E origin (`http://localhost:3100`) as well as local Nuxt (`:3000`). OTP verify is API-based, so redirect URLs matter less than magic links — still align them now.
- Do **not** turn on email confirmations. Local `[auth.email] enable_confirmations = false` is correct for OTP-in-popup.

### Playwright (step 1)

New spec, e.g. `tests/e2e/auth.spec.ts`. Suggested cases:

- Nav shows **Sign In**; **Manage Account** is absent.
- **Sign In** opens a dialog; cancel/close returns to **Sign In**.
- Full OTP: request code → read code from local mail inbox → verify → nav shows **Manage Account**.
- Account popup shows the signed-in email; **Sign out** returns **Sign In**.
- Reload after login still shows **Manage Account**.
- Bad OTP stays logged out and shows an error.

Helpers to add in `tests/e2e/helpers.ts` (or `tests/e2e/auth.ts`):

- `openLogin(page)` / `signInWithOtp(page, email)` — UI path.
- `fetchOtp(email)` — pull the latest 6-digit code from local Inbucket/Mailpit (`http://127.0.0.1:54324`).
- Unique emails per test (`e2e+<uuid>@example.com`) so inbox and `auth.users` do not collide.

Existing valuation / snapshot tests should still pass except the **nav** screenshot/ARIA, which must be updated for the new button.

### Done when

- OTP works against local Supabase (not a mocked `/api` login).
- Auth spec is green.
- Full suite green after the intentional nav snapshot update.

---

## Step 2 — Must be logged in to valuate (no credits)

Goal: anonymous submit cannot spend an Anthropic call. No remaining-credit math.

### Product

- **Get honest valuation** while logged out opens the login popup (same OTP dialog as the nav). After a successful login, the form stays filled; they click valuate again.
- Logged-in submit behaves as today (result card, usage_events, etc.).
- Server is the source of truth: `/api/valuate` returns **401** without a valid Supabase JWT. The UI does not “honor-system” a client flag.

### Engineering

- Pass the access token from the browser session on `POST /api/valuate` (`Authorization: Bearer …`).
- Verify the JWT on the server (Supabase Auth `/user` or JWT secret). Reject missing/invalid tokens before building the valuation prompt.
- Step 2 does not count remaining credits and does not 402. The 3-free gate is in [stripe-credits-plan.md](./stripe-credits-plan.md).
- Optional: if they open valuate from the login popup path, still do **not** auto-submit.

### Playwright (step 2)

- Logged out: submit does **not** produce `valuation-result`; login dialog is visible; Anthropic is not required to have been called (assert no result / 401 handled in UI).
- After OTP in that dialog, a second submit produces a normal valuation.
- Existing `valuate.spec.ts` cases that call `submitValuation` must sign in first (shared `signInWithOtp` or a faster admin-seeded session helper — see below).
- Logged-in valuation still writes `usage_events` (current test) until step 3 changes that contract.

A **test-only session shortcut** (Admin API `generateLink` / create user + password, using the local service role key) is allowed **in addition to** one real OTP UI test, so the rest of the valuation suite does not hit Inbucket on every case. Do not use that shortcut as the only proof that login works.

### Done when

- Anonymous `/api/valuate` is 401.
- Valuation suite is green with login.
- Auth spec still covers the OTP UI.

---

## Step 3 — Per-account valuation counter (no limit yet)

Goal: each successful valuation increments a durable count on the account. The product does **not** stop the 4th valuation.

### Product / schema (decide at the start of this step)

Preferred shape (Stripe-ready, still unused for gating):

- `public.profiles` (or `user_credits`): `user_id` PK → `auth.users`, `valuation_count int not null default 0`, timestamps.
- Trigger on `auth.users` insert creates the profile.
- After a successful valuate (LLM returned), increment atomically (`update … set valuation_count = valuation_count + 1` or a small RPC). Do not increment on 4xx/5xx.
- Keep `usage_events` as an audit log; add `user_id` when a session exists. Do not make “count the rows” the product counter.

Account popup can then show “Valuations run: N” (or remaining-free later). Still no paywall.

### Engineering

- Server uses the **service role** for the increment (user must not be able to rewrite their count via anon RLS). Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.example` / Nuxt `runtimeConfig` (local demo key is fine; never expose it to the client).
- Tighten `usage_events` RLS when `user_id` exists so the world cannot insert arbitrary rows. Tests that read the table will need the service role helper (see below).

### Playwright (step 3)

- After a signed-in valuation, `profiles.valuation_count` (or equivalent) is 1; a second valuation makes it 2.
- Failed valuation (mocked Anthropic 500) does not increment.
- Two different accounts have independent counts.
- Extend the existing `fetchUsageEvents` pattern to a service-role REST helper so tests can read `profiles` even after RLS tightens.

### Done when

- Counter tests pass against local Supabase.
- No 402 / “out of credits” behavior exists yet.

---

## Out of scope (later)

- Stripe checkout, webhooks, paid credit balance.
- Enforcing “3 free then pay.”
- Gating comps / checklist / listing parse.
- Password, Google, magic-link-only login.
- Replacing `spv_client_id` for non-valuation features.

---

## Playwright vs local Supabase

**Public table data: already in good shape.**  
Helpers use the local REST URL (`LOCAL_SUPABASE` in `tests/e2e/helpers.ts`). Lookup tests hit the real `aircraft` seed with the anon key. `usage_events` and `profiles` are read with the service role after RLS tightened. CI starts Supabase (`npm run db:start`) then runs Playwright. Tests are serial (`workers: 1`), which fits a shared local DB.

**Auth, profiles, and usage_events: wired.**  
OTP reads Mailpit (`:54324`). Sessions can be seeded via the Auth Admin API. `fetchProfile` / `fetchUsageEvents` use the local service-role REST key so they still work after RLS tightened on `usage_events` and `profiles`.

| Need | How |
|---|---|
| OTP code | HTTP to local Mailpit on `:54324`. |
| “Is this user in Auth?” | Auth Admin API with the local service role JWT (`/auth/v1/admin/users`). |
| Browser session | Drive the real popup, or `seedAdminSession` / `signInWithAdminSession`. |
| Profile / count rows | `fetchProfile(userId)` — service-role REST against `public.profiles`. |

We do **not** need a raw `psql` connection. REST + Auth Admin + Mailpit is enough.

**Local Auth caveats to handle in step 1**

- Playwright origin is `http://localhost:3100`; Nuxt dev is `:3000`. Put both on Auth allow-lists.
- `[auth.rate_limit] email_sent = 2` is tight if SMTP rate limits apply locally. Prefer unique emails and one OTP-UI test plus an admin session helper for the rest of the suite if Inbucket or GoTrue starts throttling.
- Do not mock `api.anthropic.com` as a stand-in for Auth. GoTrue on `:54321` stays live, same as `aircraft`.
