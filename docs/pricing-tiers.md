# SmallPlaneValue — Tier Pricing & Monetization Spec

**Document purpose:** Product and engineering reference for implementing paid tiers on smallplanevalue.com.  
**Audience:** Developer implementing billing, rate limits, and feature gating.  
**Date:** June 2026  
**Status:** Proposal — not yet implemented in code.

---

## Executive summary

SmallPlaneValue should use a **freemium + credits** model, not a subscription-only model. Most users need valuations **once per aircraft hunt**; recurring subscriptions fit only active buyers and brokers.

**Recommended launch:** Free tier + **$24 single full valuation** + **$79 five-pack**. Add subscriptions after repeat usage is proven.

**Positioning:** *"$25 to sanity-check a $300k decision."* Paid users get more **depth and tools**, not inflated numbers. Trust is the product.

---

## Current product surface (what exists today)

| Feature | Route / location | API cost profile |
|--------|------------------|------------------|
| N-number lookup | `/api/faa-lookup`, Lookup tab | Low (Supabase) |
| AI valuation | `/api/valuate`, Valuation tab | **High** (Anthropic + web search + comps) |
| Market comps | `/api/comps`, Comps tab | Medium–High |
| Pre-buy checklist | `/api/checklist`, Checklist tab | Medium |
| Listing auto-fill | `/api/parse-listing` | Medium |
| Sold-price submit | Sold tab (localStorage today) | Low |
| Feedback | `/api/feedback` | Low |

**Funnel:** ntailnum.com → smallplanevalue.com (shared Supabase aircraft DB).

---

## Pricing tiers

### Tier 1 — Free (discovery + funnel)

| | |
|---|---|
| **Price** | $0 |
| **Goal** | SEO, ntailnum funnel, trust-building |

**Includes**

- N-number lookup — unlimited
- Basic valuation — **1–2 per month** per IP or account
- Simplified output — seller ask + fair market only (hide negotiating tips, comp detail, confidence breakdown)
- Pre-buy checklist — **1 per month**
- Sold-price submission — unlimited (feeds crowd-sourced transaction database)

**Excludes / limits**

- Full valuation report (buyer target, negotiating tips, detailed analysis)
- PDF export
- Saved aircraft history
- Unlimited comps

---

### Tier 2 — Pilot Pass (pay-per-report)

| | |
|---|---|
| **Price** | **$19–29 per full valuation** (recommend **$24** at launch) |
| **Bundle** | **5-pack for $79** |
| **Goal** | Casual buyers shopping one aircraft |

**Includes**

- Full valuation: seller ask, fair market value, buyer target
- Avionics / logbook / damage / out-of-annual adjustments (existing deterministic post-processing)
- Negotiating tips + confidence score
- Market comps unlocked for that aircraft
- Pre-buy checklist for that aircraft
- PDF export or shareable link (to be built)

**Stripe product suggestion**

- `spv_valuation_single` — $24 one-time
- `spv_valuation_5pack` — $79 one-time (5 credits)

---

### Tier 3 — Buyer Pro (subscription)

| | |
|---|---|
| **Price** | **$39/month** or **$299/year** |
| **Goal** | Active shoppers comparing 3–10 aircraft |

**Includes**

- **10 full valuations per month**
- Unlimited comps + checklists
- Listing paste auto-fill
- Save / compare aircraft side-by-side (to be built)
- Email alerts when sold-price data is added for watched models (future)

**Stripe product suggestion**

- `spv_buyer_pro_monthly` — $39/mo
- `spv_buyer_pro_annual` — $299/yr

---

### Tier 4 — Broker / CFI / Shop (B2B)

| | |
|---|---|
| **Price** | **$99–149/month** or **$999/year** |
| **Goal** | Users running valuations weekly |

**Includes**

- **30–50 valuations per month**
- White-label PDF ("Prepared with SmallPlaneValue")
- Client-facing share links
- Priority support
- API access (future, optional)

**Stripe product suggestion**

- `spv_broker_monthly` — $129/mo (midpoint)
- `spv_broker_annual` — $999/yr

---

## Optional add-ons (future)

| Add-on | Price | Description |
|--------|-------|-------------|
| Listing review | $9–15 | Paste a Controller / TAP listing; get over/under-ask verdict |
| Negotiation brief | $9–15 | One-page email template for seller negotiation |

---

## Feature gating matrix

| Feature | Free | Pilot Pass (credit) | Buyer Pro | Broker |
|---------|------|---------------------|-----------|--------|
| N-number lookup | ✓ unlimited | ✓ | ✓ | ✓ |
| Basic valuation (limited fields) | ✓ 1–2/mo | — | — | — |
| Full valuation | — | ✓ per credit | ✓ 10/mo | ✓ 30–50/mo |
| Comps (full detail) | Limited | ✓ per aircraft | ✓ unlimited | ✓ unlimited |
| Checklist | 1/mo | ✓ per aircraft | ✓ unlimited | ✓ unlimited |
| Parse listing | — | ✓ | ✓ | ✓ |
| PDF / share link | — | ✓ | ✓ | ✓ white-label |
| Sold-price submit | ✓ | ✓ | ✓ | ✓ |
| Saved / compare aircraft | — | — | ✓ | ✓ |

---

## What to gate in code (engineering notes)

### High-cost endpoints — require auth + credit or active subscription

- `POST /api/valuate` — full response unless free-tier basic mode
- `POST /api/comps` — full detail behind paywall
- `POST /api/checklist` — beyond free monthly limit
- `POST /api/parse-listing` — Buyer Pro+ or consumes a credit

### Keep free (low cost, high funnel value)

- `POST /api/faa-lookup`
- `POST /api/feedback`
- Sold-price submission UI (move from localStorage to Supabase when ready)

### Free-tier valuation behavior

When a free user hits `/api/valuate`, either:

1. Return truncated JSON (sellerAsk + fairMarketValue only), or
2. Return full JSON but hide fields in UI with upgrade CTA

Recommend server-side truncation so API cannot be scraped for full reports.

### Rate limiting

- Free: 1–2 valuations / month per `user_id` or fingerprinted IP
- Track usage in Supabase table: `usage_events (user_id, feature, created_at)`
- Credits: `user_credits (user_id, balance, updated_at)` decrement on full valuation

### Auth

- Email magic link or Google OAuth (Supabase Auth fits existing stack)
- ntailnum.com can share auth session or deep-link with token later

### Payments

- **Stripe Checkout** for one-time packs and subscriptions
- Webhook: `checkout.session.completed` → add credits or activate subscription
- Store: `subscriptions (user_id, stripe_customer_id, plan, status, period_end)`

---

## Launch sequence (phased rollout)

### Phase 1 — Now

- Free lookup + **1 free full valuation per month** (email capture before 2nd valuation)
- No Stripe yet; measure conversion intent (click "Get full report")

### Phase 2 — Week 2

- Stripe: **$24 single report** + **$79 five-pack**
- Gate `/api/valuate` full response behind credit check
- Add upgrade CTA on valuation results page

### Phase 3 — Month 2

- Buyer Pro subscription ($39/mo, $299/yr)
- PDF export + saved aircraft list
- Only launch if analytics show repeat users

### Phase 4 — Month 3+

- Broker tier
- White-label PDF
- Consider API for partners

**Do not launch all four tiers on day one.** Start with Free + $24/report.

---

## Competitive positioning

| Competitor | Their angle | SmallPlaneValue counter |
|-----------|-------------|-------------------------|
| Sandhill (if/when live) | Likely black-box number | Show your work — comps, adjustments, buyer vs seller view |
| Vref / Aircraft Bluebook | Dealer reference subscription | Pilot-friendly, one-off pricing, experimental/kit coverage |
| ASA certified appraisal | Legal / financing grade | Pre-transaction research — "not an appraisal" is a feature |

**Disclaimer (already on site):** Not a certified appraisal. For financing, insurance, or legal transactions, engage an ASA-certified appraiser.

---

## Pricing rationale (for stakeholder context)

- Pre-buy inspection: **$500–$1,500**
- Certified appraisal: **$500–$2,000+**
- Vref dealer access: **~$100–300/year**
- SPV at **$24/report** is an easy yes if it prevents a $20k overpay on a $300k aircraft
- Subscription only makes sense for users actively comparing multiple aircraft

---

## Trust rule (non-negotiable)

**Never charge for inflated valuations.** Paid tiers unlock depth (comps, tips, PDF, history), not a higher number. This is core brand differentiation vs black-box competitors.

---

## Open questions for dev

1. Supabase Auth vs separate auth provider?
2. Credit expiration (e.g. 12 months) for 5-packs?
3. Guest checkout (email only) vs account required?
4. Move sold-price data from localStorage to Supabase now or with billing?
5. PDF generation: server-side (Puppeteer) vs client print stylesheet?

---

## Suggested Supabase tables (starter schema)

```sql
-- users extended via Supabase Auth (auth.users)

create table user_credits (
  user_id uuid primary key references auth.users(id),
  balance int not null default 0,
  updated_at timestamptz default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null, -- 'buyer_pro' | 'broker'
  status text not null, -- 'active' | 'canceled' | 'past_due'
  period_end timestamptz,
  created_at timestamptz default now()
);

create table usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  feature text not null, -- 'valuate' | 'comps' | 'checklist' | 'parse_listing'
  metadata jsonb,
  created_at timestamptz default now()
);

create index usage_events_user_feature_created
  on usage_events (user_id, feature, created_at desc);
```

---

## Contact / owner

Product owner: John Wallace  
Site: https://smallplanevalue.com  
Related: https://ntailnum.com (N-number lookup funnel)

---

*End of document.*
