# GA4 key events — SmallPlaneValue

Property ID: **G-1Y4143JY7Y**

The site already sends page views. These six events measure the actions that show whether the product is getting traction. GA4 does not count an event as a **key event** until you mark it in Admin, so the home card stays at **Key events: 0** until Step 2.

| Visitor action | Event name | Importance |
|---|---|---|
| Starts an aircraft valuation | `valuation_started` | High |
| Completes an aircraft valuation | `valuation_completed` | Critical |
| Creates an account | `sign_up` | High |
| Clicks a broker contact link | `broker_contact_click` | High |
| Submits a sales inquiry | `sales_inquiry_submit` | High |
| Visits an aircraft information page | `aircraft_info_view` | Medium |

`sign_up` is the GA4 recommended name for account creation. Later sign-ins do not send it again.

## What fires each event

| Event | When |
|---|---|
| `valuation_started` | Signed-in visitor clicks **Get honest valuation** and the request is sent |
| `valuation_completed` | That request returns a valuation |
| `sign_up` | First successful email-code confirmation (`method: email`) |
| `broker_contact_click` | Click on AirLogbooks, Trade-A-Plane, Controller, or Barnstormers |
| `sales_inquiry_submit` | Email inquiry submitted on an aircraft record (N-number lookup) |
| `aircraft_info_view` | FAA record for an N-number is shown |

Aircraft parameters (`make`, `model`, `year`, `n_number`) are included. Email addresses are not sent to Google Analytics.

Other events still fire and are not key events: `lookup_success`, `ntailnum_referral`, `valuation_accuracy_feedback`, `feedback_submitted`.

## Step 1 — See them in DebugView

1. Open [Google Analytics](https://analytics.google.com/) → the SmallPlaneValue property.
2. **Admin** (gear) → **Data display** → **DebugView**.
3. Open `https://smallplanevalue.com/?ga_debug=1` (turn off ad blockers).
4. Look up an N-number, submit the sales inquiry, start and finish a valuation, create an account, and click a Trade-A-Plane or AirLogbooks link.

Each event should show in DebugView within a few seconds.

## Step 2 — Mark them as key events

Key events apply to **new data only**.

1. **Admin** → **Data display** → **Events**.
2. After a test fire, find each event under **Recent events**.
3. Toggle **Mark as key event** on for all six names in the table above.
4. Confirm **Reports** → **Key events** is no longer zero once new traffic arrives. Standard reports can lag up to 24 hours; DebugView does not.

If an event is missing from the list, fire it once with `?ga_debug=1` and watch DebugView. Custom events can take up to a day to appear under Events without DebugView.

## Step 3 — Import to Google Ads

1. **Google Ads** → **Goals** → **Conversions** → **New conversion action**.
2. **Import** → **Google Analytics 4 properties**.
3. Primary goal: `valuation_completed`.
4. Secondary goals: `sign_up`, `sales_inquiry_submit`, `broker_contact_click`, `valuation_started`.
5. Leave `aircraft_info_view` as an analytics event unless you want a soft engagement goal.

## Troubleshooting

- **Key events still 0?** The events are firing, but none are marked in Admin yet. Step 2 is required.
- **No DebugView data?** Disable ad blockers and confirm `G-1Y4143JY7Y` is in the page source.
- **`sign_up` missing on a test login?** That address already had an account. Use a new email.
