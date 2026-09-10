# Stripe onboarding — SmallPlaneValue

**Site:** https://smallplanevalue.com  
**What this is for:** paste-ready answers for Stripe’s business-description box, plus how payments work on the site.

Stripe reads this form **and** the website. smallplanevalue.com already says the product is **not a certified appraisal**. Describe the business the same way here.

---

## Narrative for the description box (paste this)

Edited from the draft: *“We offer future or current airplane owners the ability to evaluate an accurate price to either sell or buy an airplane. We are developing a database of sold airplanes to accurately provide real time price points. In addition, we are going to add safety and cost comparisons to our website.”*

```
SmallPlaneValue.com is an online software service for current and prospective airplane owners. Customers buy digital reports that estimate what a specific used aircraft is worth to buy or sell — typical asking range, fair market value, and a buyer offer target. We are building a crowd-sourced database of sold airplanes so those estimates track real-world price points, and the site also includes related research such as pre-buy checklists (with safety and operating-cost comparisons as the product grows). Reports are for shopping and research only; they are not certified appraisals and are not for financing, insurance, or legal transactions. Customers pay a one-time fee on the website (per report or a multi-report pack) and receive the digital report immediately.
```

Shorter if the box is tight:

```
Online software at SmallPlaneValue.com: current and future airplane owners buy digital valuation reports to estimate a fair price when buying or selling a used aircraft. We use listing data and a growing sold-aircraft database. Research estimates only, not certified appraisals. One-time payment per report or report pack; delivered instantly on the website.
```

---

## What to select (industry / type)

**Pick software / SaaS / digital products** — not appraisal, not consulting.

| Option you might see | Use it? |
|----------------------|---------|
| Software, SaaS, computer software, digital goods, information services | **Yes** — this is it |
| Consulting / management consulting | No — you are not billing hourly advice |
| Appraisal / real estate appraisal / professional appraisal | No — you do not issue certified appraisals |
| Professional services (catch-all) | Only if there is no software/SaaS choice |

You sell **self-serve digital reports** on a website. Customers pay for a valuation (and checklist) in the product, not for a licensed appraiser’s opinion used in a loan or insurance file.

---

## Other Stripe fields

| Field | Put this |
|-------|----------|
| Product / URL | https://smallplanevalue.com |
| Statement descriptor | `SMALLPLANEVALUE` |
| Customer support | jpwallacejr@gmail.com |
| When customers get the product | Immediately online after payment |
| Refunds | Digital report; refund if the valuation did not generate |

---

## What the site charges

| Product | Price | Credits |
|---------|-------|---------|
| Full aircraft valuation | $24 | 1 report |
| Aircraft valuation 5-pack | $79 | 5 reports |

Checkout is Stripe-hosted. The first valuation each month is free; further reports use a purchased credit.

---

## Vercel / Stripe setup (so checkout actually works)

1. In Stripe Dashboard (test mode first): Developers → API keys. Copy the **secret key**.
2. Developers → Webhooks → Add endpoint: `https://smallplanevalue.com/api/stripe/webhook`  
   Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`.
3. Apply the Supabase migration `0005_create_credits.sql` (creates `user_credits`, `purchases`, and credit RPCs).
4. Set these Vercel environment variables:

| Variable | Required | Notes |
|----------|----------|--------|
| `STRIPE_SECRET_KEY` | Yes | `sk_test_…` then `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | Yes | `whsec_…` from the webhook endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only; used to grant/consume credits |
| `SPV_VALUATION_LIMITS` | Optional | Default: limits turn **on** when a Stripe secret key is present. Set `false` to keep unlimited beta. |
| `STRIPE_PRICE_SINGLE` / `STRIPE_PRICE_FIVEPACK` | Optional | Dashboard Price IDs. If omitted, Checkout uses $24 / $79 `price_data`. |
| `NUXT_PUBLIC_SITE_URL` | Optional | Defaults to `https://smallplanevalue.com` |

5. Redeploy. Buy a test report with card `4242 4242 4242 4242`. You should return to the valuation tab with a credit remaining.
