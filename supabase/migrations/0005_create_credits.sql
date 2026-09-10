-- Paid valuation credits (Stripe Checkout). Writes go through service_role RPCs.

create table if not exists public.user_credits (
  client_id text primary key,
  email text,
  balance int not null default 0 check (balance >= 0),
  stripe_customer_id text,
  updated_at timestamptz not null default now()
);

create index if not exists user_credits_email_idx on public.user_credits (email);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  email text,
  stripe_session_id text not null unique,
  product text not null,
  credits int not null,
  amount_cents int not null,
  stripe_customer_id text,
  stripe_event_id text,
  created_at timestamptz not null default now()
);

create index if not exists purchases_client_id_idx on public.purchases (client_id);

alter table public.user_credits enable row level security;
alter table public.purchases enable row level security;

create or replace function public.grant_valuation_credits(
  p_client_id text,
  p_email text,
  p_credits int,
  p_session_id text,
  p_product text,
  p_amount_cents int,
  p_customer_id text,
  p_event_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance int;
  inserted_id uuid;
begin
  if p_client_id is null or length(trim(p_client_id)) < 8 then
    raise exception 'client_id required';
  end if;
  if p_credits is null or p_credits < 1 then
    raise exception 'credits must be positive';
  end if;

  insert into purchases (
    client_id, email, stripe_session_id, product, credits, amount_cents, stripe_customer_id, stripe_event_id
  ) values (
    p_client_id, p_email, p_session_id, p_product, p_credits, p_amount_cents, p_customer_id, p_event_id
  )
  on conflict (stripe_session_id) do nothing
  returning id into inserted_id;

  if inserted_id is null then
    select balance into new_balance from user_credits where client_id = p_client_id;
    return jsonb_build_object('ok', true, 'duplicate', true, 'balance', coalesce(new_balance, 0));
  end if;

  insert into user_credits (client_id, email, balance, stripe_customer_id, updated_at)
  values (p_client_id, p_email, p_credits, p_customer_id, now())
  on conflict (client_id) do update
    set balance = user_credits.balance + excluded.balance,
        email = coalesce(excluded.email, user_credits.email),
        stripe_customer_id = coalesce(excluded.stripe_customer_id, user_credits.stripe_customer_id),
        updated_at = now();

  select balance into new_balance from user_credits where client_id = p_client_id;
  return jsonb_build_object('ok', true, 'duplicate', false, 'balance', new_balance);
end;
$$;

create or replace function public.consume_valuation_credit(p_client_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance int;
begin
  update user_credits
     set balance = balance - 1,
         updated_at = now()
   where client_id = p_client_id
     and balance > 0
  returning balance into new_balance;

  if new_balance is null then
    return jsonb_build_object('ok', false, 'balance', 0);
  end if;
  return jsonb_build_object('ok', true, 'balance', new_balance);
end;
$$;

create or replace function public.refund_valuation_credit(p_client_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance int;
begin
  insert into user_credits (client_id, balance, updated_at)
  values (p_client_id, 1, now())
  on conflict (client_id) do update
    set balance = user_credits.balance + 1,
        updated_at = now();

  select balance into new_balance from user_credits where client_id = p_client_id;
  return jsonb_build_object('ok', true, 'balance', new_balance);
end;
$$;

revoke all on function public.grant_valuation_credits(text, text, int, text, text, int, text, text) from public, anon, authenticated;
revoke all on function public.consume_valuation_credit(text) from public, anon, authenticated;
revoke all on function public.refund_valuation_credit(text) from public, anon, authenticated;

grant execute on function public.grant_valuation_credits(text, text, int, text, text, int, text, text) to service_role;
grant execute on function public.consume_valuation_credit(text) to service_role;
grant execute on function public.refund_valuation_credit(text) to service_role;
