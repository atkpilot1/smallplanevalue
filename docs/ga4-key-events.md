# GA4 key events (conversions) — setup for SmallPlaneValue

Property ID: **G-9ET7HJRJWC**

The site now fires the business events below. **Key events: 0** in the GA4 reports until you mark them in Admin — custom events are not conversions until you star them. That toggle applies to **new hits only**.

## Step 1 — Fire a test event (DebugView)

1. Open [Google Analytics](https://analytics.google.com/) → your SmallPlaneValue property.
2. Go to **Admin** (gear, bottom left) → **Data display** → **DebugView**.
3. In another tab, open the site with debug mode (ad blockers off):
   - `https://smallplanevalue.com/?ga_debug=1`
4. Sign in and run one valuation.
5. Submit a sale on **Report a sale**, look up `172SP`, and click **Trade-A-Plane** on a comps result.

You should see in DebugView within seconds:

| Event | When |
|-------|------|
| `valuation_started` | Click **Get honest valuation** with make + model filled |
| `valuation_completed` | Valuation result rendered |
| `sign_up` | First OTP verify for a new email |
| `generate_lead` | **Report a sale** submitted |
| `broker_contact_click` | TAP / Controller / Barnstormers / AirLogbooks link |
| `view_item` | FAA lookup result shown |
| `begin_checkout` | Click **$24** or **$75** |
| `purchase` | Return from Stripe (`?paid=1`) |
| `ntailnum_referral` | Land from ntailnum with `?n=` |

## Step 2 — Mark as key events

1. **Admin** → **Data display** → **Events** (or **Key events**).
2. Toggle **Mark as key event** ON for, in this order:

   | Event | Why |
   |-------|-----|
   | `valuation_completed` | Critical — finished a valuation |
   | `sign_up` | New account |
   | `generate_lead` | Sale report / inquiry |
   | `begin_checkout` | Paid-credit intent ($24 / $75) |
   | `valuation_started` | Started the funnel |
   | `broker_contact_click` | Outbound listing / partner click |
   | `view_item` | Aircraft information view |

3. Optional: `purchase`, `login`, `ntailnum_referral`.

Key events apply to **new data only** (not retroactive). After the toggle, use DebugView — the Reports **Key events** card can lag up to 24 hours.

## Step 3 — Import to Google Ads (when you run ads)

1. **Google Ads** → **Goals** → **Conversions** → **New conversion action**.
2. Choose **Import** → **Google Analytics 4 properties**.
3. Select **`generate_lead`** as the primary lead goal and **`begin_checkout`** / **`purchase`** for paid valuations.
4. Use **`valuation_completed`** as a micro-conversion for traffic campaigns.

`begin_checkout` includes `value` (24 or 75) and `currency: USD` for value-based bidding.

## Funnel events reference

| Event | Source | Purpose |
|-------|--------|---------|
| `valuation_started` | SPV | Clicked Get honest valuation |
| `valuation_completed` | SPV | Valuation finished |
| `valuation_limit_reached` | SPV | Free credits exhausted (paywall) |
| `sign_up` | SPV | New account via email OTP |
| `login` | SPV | Returning account via OTP |
| `generate_lead` | SPV | Report-a-sale submitted |
| `broker_contact_click` | SPV | Marketplace or partner outbound |
| `view_item` | SPV | Aircraft registry result |
| `lookup_success` | SPV | Registry lookup completed |
| `begin_checkout` | SPV | Stripe Checkout started |
| `purchase` | SPV | Checkout return `paid=1` |
| `valuation_accuracy_feedback` | SPV | Too low / right / too high |
| `feedback_submitted` | SPV | Feedback tab |
| `cta_click_spv` | ntailnum | Click through to SPV |
| `lead_submit` | ntailnum | Email on lookup result |
| `ntailnum_referral` | SPV | Arrived via ntailnum deep link |

## Troubleshooting

- **Key events: 0** with traffic in Reports? Events are firing but are not starred yet — that is a GA4 Admin toggle, not a site outage.
- **Event not in list?** Trigger it once with `?ga_debug=1` and watch DebugView.
- **No DebugView data?** Disable ad blockers; confirm `G-9ET7HJRJWC` in page source.
- **Still waiting?** Custom events can take up to 24h to appear under Events without DebugView; DebugView is instant.
