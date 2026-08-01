-- Paid valuation credits (Stripe Checkout fulfillment).
create table if not exists public.user_credits (
  client_id text primary key,
  email text,
  stripe_customer_id text,
  balance int not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_fulfillments (
  stripe_session_id text primary key,
  client_id text not null,
  email text,
  credits int not null check (credits > 0),
  pack text,
  amount_total int,
  created_at timestamptz not null default now()
);

create index if not exists user_credits_email_idx on public.user_credits (email);
create index if not exists stripe_fulfillments_client_idx on public.stripe_fulfillments (client_id);

alter table public.user_credits enable row level security;
alter table public.stripe_fulfillments enable row level security;

-- Server uses anon key today (same pattern as usage_events). Tighten when service role lands.
create policy "anon_select_user_credits"
  on public.user_credits for select to anon using (true);
create policy "anon_insert_user_credits"
  on public.user_credits for insert to anon with check (true);
create policy "anon_update_user_credits"
  on public.user_credits for update to anon using (true) with check (true);

create policy "anon_select_stripe_fulfillments"
  on public.stripe_fulfillments for select to anon using (true);
create policy "anon_insert_stripe_fulfillments"
  on public.stripe_fulfillments for insert to anon with check (true);
