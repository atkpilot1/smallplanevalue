# E2E coverage checklist

**Philosophy:** Thoroughly test the entire shipped app. Mock only the outside world (Anthropic). Drive the real Nuxt handlers, the real valuation/checklist/lookup logic, and the local Supabase instance. A test that stubs `/api/*` in the browser does not count. If a user-visible path is broken, write the failing test and leave the app alone (TDD).

**Locators:** Prefer roles, labels, and button names over CSS ids. Use `data-testid` only on result regions (`lookup-result`, `valuation-result`, `comps-result`, `checklist-result`, `sold-result`, `sold-recent`, `feedback-result`) and pane wrappers. Keep those names when the UI moves to Nuxt components.

Anthropic is mocked at the Node boundary via `playwright-backend-mocks`. Local Supabase must already be running (`npm run db:start`). Playwright starts the mocks proxy and Nuxt on `:3100`.

Deterministic valuation dollars are pinned to the mocked AI baseline (`$320,000` ask / `$295,000` FMV / `$280,000` buyer) plus the server’s post-AI adjustments.

## Shell

- [x] Page title and hero
- [x] All six tabs activate their panes

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
- [x] Successful valuation writes `spv_client_id` and a `usage_events` row
- [x] Lookup `172SP` then value: engine TBO note + fresh-engine adj uses IO-360 overhaul ($18k)
- [x] Engine life bar appears after entering SMOH (`GET /api/engine-tbo`)

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
