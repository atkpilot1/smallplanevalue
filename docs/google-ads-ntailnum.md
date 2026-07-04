# Google Ads quick start — ntailnum → SmallPlaneValue

Use this **after** GA4 events are live (`lookup_success`, `cta_click_spv`, `lead_submit`, `ntailnum_referral`).

## Campaign (starter: $10–20/day)

1. [ads.google.com](https://ads.google.com) → New campaign → **Search**
2. Goal: **Leads** or **Website traffic** (switch to **Conversions** once SPV checkout exists)
3. Campaign name: `N-number lookup`
4. Daily budget: **$15**
5. Keywords (phrase match):
   - `"n number lookup"`
   - `"faa aircraft registration lookup"`
   - `"aircraft tail number lookup"`
6. Final URL: `https://ntailnum.com/?utm_source=google&utm_medium=cpc&utm_campaign=n_lookup`
7. Negative keywords: `free download`, `pdf`, `form 8050`

## Conversions to track (GA4 → Google Ads)

| Event | Meaning |
|-------|---------|
| `lookup_success` | Registry lookup completed |
| `cta_click_spv` | User clicked through to SmallPlaneValue |
| `lead_submit` | Email captured on ntailnum |
| `ntailnum_referral` | Landed on SPV from ntailnum deep link |

Import these in Google Ads → Goals → Conversions → Import from GA4.

Primary conversion when Stripe is live: **purchase** on smallplanevalue.com.

## Do not

- Sell or share **owner name/address** from FAA data with marketers
- Put display ads **above** the valuation CTA on lookup results
- Increase spend without watching **cost per `cta_click_spv`** and (later) **cost per paid valuation**
