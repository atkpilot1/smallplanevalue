# E2E coverage checklist

**Philosophy:** Thoroughly test the entire shipped app. Mock only the outside world (Anthropic and Stripe HTTP). Drive the real Nuxt handlers, the real valuation/checklist/lookup logic, and the local Supabase instance. A test that stubs `/api/*` in the browser does not count. If a user-visible path is broken, write the failing test and leave the app alone (TDD).

**Locators:** Prefer roles, labels, and button names over CSS ids. Use `data-testid` only on result regions (`lookup-result`, `valuation-result`, `comps-result`, `checklist-result`, `sold-result`, `sold-recent`, `feedback-result`) and pane wrappers. Keep those names when the UI moves to Nuxt components.

Anthropic is mocked at the Node boundary via `playwright-backend-mocks`. Local Supabase must already be running (`npm run db:start`). Playwright serves the production Node build on `:3100` (`npm run build`, then `node .output/server/index.mjs`).

Deterministic valuation dollars are pinned to the mocked AI baseline (`$320,000` ask / `$295,000` FMV / `$280,000` buyer) plus the server’s post-AI adjustments.

## Shell

- [x] Page title and hero
- [x] All six tabs activate their panes

## Auth (live local GoTrue + Mailpit OTP)

- [x] Nav shows **Sign In** (not **Manage Account**) next to **Look up my plane**
- [x] **Sign In** opens a dialog; Close and Escape dismiss it
- [x] Empty / invalid email stay on the email step with an error
- [x] Full OTP: Mailpit code → **Manage Account**, account popup shows email, **Free remaining** `3`, **Paid credits** `0`, **Valuations run** `0`, buy buttons, reload keeps session, **Sign out** returns **Sign In**
- [x] Bad OTP stays logged out and shows an error
- [x] **Use a different email** returns to the email step
- [x] Signing in as a second account replaces the previous session

## N-number lookup (live `aircraft` table)

- [x] Seeded `172SP` renders Cessna 172S / LOCAL DEV / Lycoming
- [x] Example chip `172SP` triggers the same lookup
- [x] Seeded `22T` renders Cirrus SR22T
- [x] Seeded `182RG` renders Cessna R182
- [x] Seeded `58P` renders Beech 58P
- [x] Unknown N-number shows the not-found state
- [x] Empty submit alerts the user
- [x] Deep link `?n=172SP` auto-looks up
- [x] Lookup → Get valuation prefills make / model / year / engine
- [x] Lookup → Pre-buy checklist prefills make / model / year
- [x] Lookup of twin `58P` switches the valuation form to twin-engine fields
- [x] Unseeded example chip (`RV10`) shows not-found (documents local seed vs UI chips)

## Valuation (live `POST /api/valuate` + `GET /api/engine-tbo`)

- [x] Anonymous `POST /api/valuate` is 401; a garbage bearer token is 401
- [x] Logged-out **Get honest valuation** opens the sign-in dialog and does not POST `/api/valuate`
- [x] OTP from that dialog does not auto-submit; a second click produces a valuation
- [x] Signed-in valuation cases use an Admin-seeded session (OTP UI stays in Auth)
- [x] Parse listing auto-fills identity (make / model / year)
- [x] Parse listing also fills TTAF, SMOH, and checks G1000
- [x] Parse listing failure alerts the user
- [x] Missing SMOH is treated as fresh: +$23k vs AI baseline, “Engine time premium”
- [x] Mid-time SMOH (1000 / 2000 TBO) leaves the AI baseline unchanged
- [x] Out of annual deducts a flat $50k
- [x] Avionics panel package (no itemized boxes) adds the package dollars
- [x] Itemized avionics skips the panel-package dollar add
- [x] Missing / incomplete logbooks apply a −18% records adjustment
- [x] Complete-since-new + clean damage apply a +7% records premium
- [x] Major documented damage applies a −12% records adjustment
- [x] Twin engines with mid-time L/R SMOH leave the AI baseline unchanged
- [x] IO-550 conversion on a pre-1996 Bonanza adds the time-weighted STC premium
- [x] Equipped F33A below the market floor is lifted to $330k / $345k / $310k
- [x] Cirrus make/model reveals the generation selector (auto G6 for 2018)
- [x] Asking price renders the listing-vs-market narrative
- [x] Empty make/model alerts the user
- [x] Anthropic 500 surfaces a valuation failure in the UI
- [x] Successful valuation writes `spv_client_id` and a `usage_events` row with `user_id`
- [x] Successful valuations increment `profiles.valuation_count` (1 then 2); account popup shows **Valuations run**, **Free remaining**, **Paid credits**
- [x] Anthropic 500 does not increment `profiles.valuation_count`
- [x] Two accounts have independent `profiles.valuation_count` values
- [x] Three free valuations then the fourth is 402 `credits_required`; paywall opens; Anthropic is not called
- [x] Anthropic 500 on the third free does not consume a slot
- [x] `valuation_count = 3`, `credit_balance = 1` succeeds and consumes the paid credit
- [x] `valuation_count = 3`, `credit_balance = 0` opens the paywall and does not call Anthropic
- [x] Two accounts have independent free + paid balances
- [x] Lookup `172SP` then value: engine TBO note + fresh-engine adj uses IO-360 overhaul ($18k)
- [x] Engine life bar appears after entering SMOH (`GET /api/engine-tbo`)
- [x] Valuation form persists to `spv_valuation_form`; reload restores fields, avionics, and lookup engine
- [x] Simulated Checkout return (`/?paid=1` without a session) keeps the form, shows the credits-added note, and does not auto-submit

## Stripe Checkout (mocked `api.stripe.com` + signed webhooks)

- [x] Account **1 valuation — $24** creates a Checkout Session and navigates toward `checkout.stripe.com`
- [x] Paywall **5 valuations — $75** does the same
- [x] Signed `checkout.session.completed` grants `credit_balance`
- [x] Same `event_id` / `session_id` is idempotent
- [x] Webhook for user B does not credit A
- [x] Bad signature is 400 and does not grant
- [x] After a grant, a fourth valuation succeeds and the account dialog updates
- [x] `POST /api/stripe/confirm` grants a paid mocked session
- [x] Success URL return confirms credits, keeps the form, and does not auto-submit
- [x] Cancel URL return (`/?tab=val&paid=0`) keeps the form, shows a canceled note, does not grant credits, and does not auto-submit
- [x] Confirm of another account’s session is 403 and does not grant
- [x] Unpaid session does not grant via confirm or webhook
- [x] Webhook then confirm on the same session grants once

## Market comps (live `POST /api/comps`)

- [x] Search renders ranges and days listed
- [x] Lookup prefills the comps make/model field
- [x] Empty model alerts the user
- [x] Year-band select still returns results
- [x] Anthropic 500 surfaces a comps failure in the UI

## Pre-buy checklist (live `POST /api/checklist` + static JS sections)

- [x] Generates static sections plus mocked model-specific items
- [x] Static sections (Documents, Engine, Flight check) always appear
- [x] Retract extras appear for model `210`
- [x] Twin extras appear for model `Baron`
- [x] Lookup `182RG` then checklist includes retract-gear items
- [x] Lookup `58P` then checklist includes twin-engine items
- [x] Pass / flag / fail updates progress, stats, and verdict
- [x] Anthropic 500 still renders the static checklist (no model-specific section)
- [x] Empty make/model alerts the user

## Report a sale (parse is live; submit is localStorage)

- [x] Missing required fields shows the validation note
- [x] Parse sale post auto-fills the form
- [x] Submit stores `spv_sold` and renders recent sales
- [x] Submit without the confirmation checkbox is blocked
- [x] Thank-you card shows discount vs asking price
- [x] Recent list caps at 10 and says so when there are more

## Feedback (live `POST /api/feedback`)

- [x] Submit shows thank-you and backs up to `spv_feedback`
- [x] Accuracy-only (no message) is accepted
- [x] Empty submit alerts the user
- [x] Post-valuation “too low / about right / too high” writes feedback
- [x] Feedback POST returns 200

## Share

- [x] Copy-for-BeechTalk sets the copied confirmation
- [x] Facebook and X links point at the current origin

## Visual + ARIA snapshots (`@snapshot`)

Lock the current HTML UI so a Nuxt rewrite can match it pixel-for-pixel and in the accessibility tree. Mock Anthropic; use live local Supabase. Pin the hero showcase with `SHOWCASE_PERIOD=0`.

**Regions to keep as rewrite anchors:** `nav`, `.hero`, `#why`, `#how-it-works`, `#tools`, `#aircraft-types`, `#app`, `.disclaimer`, `footer`, pane/result `data-testid`s.

**Review a failure:** `npx playwright show-report` or `npm run test:e2e:review-snapshots` then open `test-results/snapshot-review/` (`expected` / `actual` / `diff`). Update intentional changes with `npm run test:e2e:update-snapshots` on Linux. `SNAPSHOT_REVIEW=1` on the marketing-chrome test forces a known hero mismatch for checking the review path.

- [x] Marketing chrome (nav, hero, why, how-it-works, tools, types, disclaimer, footer) + page ARIA
- [x] Empty tool panes (all six) + pane ARIA; valuation avionics-open ARIA
- [x] Valuation pane twin-engine and Cirrus-generation variants
- [x] Lookup success and not-found result cards
- [x] Engine-life bar + valuation result (with listing ask)
- [x] Comps result card
- [x] Checklist first section + full checklist ARIA
- [x] Sold thank-you / recent list + feedback thank-you
