# SmallPlaneValue — Stripe Integration Plan

**Business:** [smallplanevalue.com](https://smallplanevalue.com)  
**Product:** GA aircraft valuation — asking price vs fair-market negotiation brief  
**Date:** August 2026  
**Status:** Phase 1 plan (no Stripe code in repo yet)

---

## Product fit (what to enable now)

| Stripe product | Need for SPV launch? | Why |
|---|---|---|
| **Payments** (Checkout) | **Yes — primary** | Sell $24 single + $79 five-pack one-time |
| **Billing** | Later (Phase 3) | Only when adding Buyer Pro subscription |
| **Connect** | **No** | You sell your own digital product; no payouts to third parties |
| **Identity** | **No at launch** | Not required to sell valuation credits to pilots |

AirLogbooks is a **marketing partner**, not a Connect seller. Do not add Connect for that relationship.

---

## Recommended architecture (Phase 1)

**Model:** Freemium credits + Stripe Checkout (one-time Payment mode)

1. Guest/pilot identified by `clientId` (localStorage today) + email at checkout  
2. Free: limited valuations/month (already sketched; `VALUATION_LIMITS_ENABLED` is currently `false`)  
3. Paid: Stripe Checkout Session → webhook → credit balance on `client_id` / email  
4. Each full `/api/valuate` consumes 1 credit after free quota is exhausted  

### Stripe objects

| Object | Purpose |
|---|---|
| Product `spv_valuation_single` | “Full valuation report” |
| Price `$24.00` USD one-time | Single credit |
| Product `spv_valuation_5pack` | “5 valuation credits” |
| Price `$79.00` USD one-time | Five credits |
| Checkout Session `mode: payment` | Hosted checkout |
| Webhook endpoint | Fulfill credits on `checkout.session.completed` |

### API surface (Nuxt server)

| Route | Role |
|---|---|
| `POST /api/checkout` | Create Checkout Session for `single` or `fivepack` |
| `POST /api/stripe-webhook` | Verify signature; grant credits; idempotent |
| `GET /api/valuation-access` | Existing — expose remaining free + paid credits |
| `POST /api/valuate` | Existing — enforce free limit + credit decrement |

### Metadata to attach on Checkout

```text
client_id, email, pack (single|fivepack), credits (1|5)
```

Use `client_reference_id` = `clientId` so webhook can restore the browser session buyer.

### Success / cancel URLs

- Success: `https://www.smallplanevalue.com/?checkout=success` (show “credits added”)  
- Cancel: `https://www.smallplanevalue.com/?checkout=cancel`

---

## Best-practice rules (from Stripe skills)

- Prefer **Checkout Sessions** over raw PaymentIntents for this on-session purchase  
- Prefer a **restricted API key (RAK)** (`rk_…`) over a full secret key in production  
- Never put secret keys in the frontend or git  
- **Omit** `payment_method_types` — use Dashboard dynamic payment methods  
- Webhook signature verification required (`STRIPE_WEBHOOK_SECRET`)  
- Fulfillment only from webhook (or session retrieve after redirect as UX, webhook as source of truth)  
- Idempotency: store `stripe_session_id` / `payment_intent` before granting credits  

---

## Env vars (Vercel / local)

```bash
STRIPE_SECRET_KEY=rk_test_...          # or sk_test_... in sandbox
STRIPE_PUBLISHABLE_KEY=pk_test_...     # only if embedding later; Checkout redirect may not need it
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_SINGLE=price_...
STRIPE_PRICE_FIVEPACK=price_...
```

---

## Data (Supabase) — minimum for launch

```sql
create table if not exists user_credits (
  client_id text primary key,
  email text,
  stripe_customer_id text,
  balance int not null default 0,
  updated_at timestamptz default now()
);

create table if not exists stripe_fulfillments (
  stripe_session_id text primary key,
  client_id text not null,
  credits int not null,
  created_at timestamptz default now()
);
```

Reuse existing `usage_events` for free-tier metering.

---

## Launch sequence

1. **Sandbox products + prices** in Stripe Dashboard (or API)  
2. Wire Checkout + webhook + credit balance  
3. Turn on `VALUATION_LIMITS_ENABLED` with a clear upgrade CTA  
4. Test cards → live keys → go live  
5. Later: Billing for Buyer Pro; Customer Portal; optional Tax  

---

## Explicitly deferred

- Connect / marketplace payouts  
- Identity verification  
- Subscriptions / Billing Portal (until repeat usage justifies it)  
- Stripe Tax (enable after tax registration decision)  

---

## Implemented in repo (Phase 1 scaffolding)

| Piece | Location |
|---|---|
| Checkout create | `POST /api/checkout` |
| Success confirm (UX) | `POST /api/checkout-confirm` |
| Webhook fulfill | `POST /api/stripe-webhook` |
| Credits helpers | `server/utils/credits.ts` |
| Supabase migration | `supabase/migrations/0005_create_credits.sql` |
| Buy buttons | Valuation tab pricing packs |
| Limit gate (off) | `VALUATION_LIMITS_ENABLED = false` until launch |

Sandbox products created under ephemeral Stripe sandbox (claim before expiry):

- Single: `$24` → `price_1TzhPiLHgKMwrJgZZvdD2V62`
- Five-pack: `$79` → `price_1TzhPiLHgKMwrJgZJrHe7LwP`

---

## Your next steps

1. **Claim the sandbox** (or connect your real Stripe account) — see claim URL from the agent session / `stripe sandbox claim`  
2. In **Cursor Desktop**: Marketplace → Stripe plugin, or MCP `https://mcp.stripe.com`, then authenticate  
3. Apply migration `0005_create_credits.sql` in Supabase  
4. Set Vercel env: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_SINGLE`, `STRIPE_PRICE_FIVEPACK`, `STRIPE_WEBHOOK_SECRET`, `SITE_URL`  
5. Point Stripe webhook to `https://www.smallplanevalue.com/api/stripe-webhook` for `checkout.session.completed`  
6. When ready to charge: set `VALUATION_LIMITS_ENABLED = true`  
7. **Skip Connect + Identity** for launch — not needed for selling your own credits
