# GA4 key events (conversions) — setup for SmallPlaneValue

Property ID: **G-9ET7HJRJWC**

Events are already firing from the site. You only need to **mark them as key events** in GA4 (takes ~2 minutes after one test fire).

## Step 1 — Fire a test event (DebugView)

1. Open [Google Analytics](https://analytics.google.com/) → your SmallPlaneValue property.
2. Go to **Admin** (gear, bottom left) → **Data display** → **DebugView**.
3. In another tab, open your site with debug mode:
   - `https://smallplanevalue.com/?ga_debug=1`
4. Go to **Valuation** tab → run one valuation (uses your free monthly credit).
5. Run a **second** valuation → enter email in the gate → click **Get full report — notify me**.

You should see in DebugView within seconds:

| Event | When |
|-------|------|
| `valuation_completed` | After a successful valuation |
| `generate_lead` | After email submitted at limit gate |
| `upgrade_intent_click` | After clicking "Get full report — notify me" |
| `valuation_limit_reached` | When monthly limit hit |
| `ntailnum_referral` | Land from ntailnum with `?n=` deep link |

## Step 2 — Mark as key events

1. **Admin** → **Data display** → **Events** (or **Key events** in newer UI).
2. Find **`upgrade_intent_click`** in the list (or under **Recent events** after Step 1).
3. Toggle **Mark as key event** (star icon) → ON.
4. Repeat for **`generate_lead`** (email capture — primary lead conversion).
5. Optional: also mark `valuation_completed`, `cta_click_spv` (ntailnum), `lead_submit` (ntailnum).

Key events apply to **new data only** (not retroactive).

## Step 3 — Import to Google Ads (when you run ads)

1. **Google Ads** → **Goals** → **Conversions** → **New conversion action**.
2. Choose **Import** → **Google Analytics 4 properties**.
3. Select **`upgrade_intent_click`** and/or **`generate_lead`**.
4. Use **`generate_lead`** as the primary optimization goal for lead campaigns.
5. Use **`upgrade_intent_click`** as a secondary / micro-conversion.

`upgrade_intent_click` includes `value: 24` and `currency: USD` for value-based bidding later.

## Funnel events reference

| Event | Source | Purpose |
|-------|--------|---------|
| `lookup_success` | SPV + ntailnum | Registry lookup completed |
| `valuation_completed` | SPV | Free valuation used |
| `valuation_accuracy_feedback` | SPV | User rated FMV too low / right / too high on results card |
| `feedback_submitted` | SPV | Feedback tab submission |
| `generate_lead` | SPV | Email captured (GA4 recommended) |
| `upgrade_intent_click` | SPV | Paid report interest ($24) |
| `cta_click_spv` | ntailnum | Click through to SPV |
| `lead_submit` | ntailnum | Email on lookup result |
| `ntailnum_referral` | SPV | Arrived via ntailnum deep link |

## Troubleshooting

- **Event not in list?** Trigger it once with `?ga_debug=1` and watch DebugView.
- **No DebugView data?** Disable ad blockers; confirm `G-9ET7HJRJWC` in page source.
- **Still waiting?** Custom events can take up to 24h to appear under Events without DebugView; DebugView is instant.
