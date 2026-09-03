-- Paid credit balance + Stripe grant ledger.
-- Free allowance is passed into consume/refund as p_free (utils/credits.ts).

alter table public.profiles
  add column if not exists credit_balance integer not null default 0;

alter table public.profiles
  drop constraint if exists profiles_credit_balance_nonneg;

alter table public.profiles
  add constraint profiles_credit_balance_nonneg check (credit_balance >= 0);

create table if not exists public.stripe_events (
  event_id text primary key,
  session_id text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  credits_granted integer not null,
  created_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;

revoke all on table public.stripe_events from public, anon, authenticated;
grant select, insert on table public.stripe_events to service_role;

-- Replaced by consume_valuation.
drop function if exists public.increment_valuation_count(uuid);

-- Atomic credit writes. Called only by the Nuxt server via service_role RPC.
-- The increment is `column = column + 1` in one UPDATE. LANGUAGE sql, not plpgsql.

create or replace function public.consume_valuation(p_user_id uuid, p_free integer)
returns jsonb
language sql
volatile
security definer
set search_path = public
as $$
  insert into public.profiles (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  with claimed as (
    update public.profiles
       set valuation_count = valuation_count + 1,
           credit_balance = credit_balance
             - case when valuation_count >= p_free then 1 else 0 end,
           updated_at = now()
     where user_id = p_user_id
       and (valuation_count < p_free or credit_balance > 0)
    returning valuation_count, credit_balance
  )
  select coalesce(
    (select jsonb_build_object(
       'valuation_count', valuation_count,
       'credit_balance', credit_balance,
       'allowed', true
     ) from claimed),
    (select jsonb_build_object(
       'valuation_count', coalesce(valuation_count, 0),
       'credit_balance', coalesce(credit_balance, 0),
       'allowed', false
     ) from public.profiles where user_id = p_user_id)
  );
$$;

create or replace function public.refund_valuation(p_user_id uuid, p_free integer)
returns jsonb
language sql
volatile
security definer
set search_path = public
as $$
  with undone as (
    update public.profiles
       set credit_balance = credit_balance
             + case when valuation_count > p_free then 1 else 0 end,
           valuation_count = greatest(0, valuation_count - 1),
           updated_at = now()
     where user_id = p_user_id
       and valuation_count > 0
    returning valuation_count, credit_balance
  )
  select coalesce(
    (select jsonb_build_object(
       'valuation_count', valuation_count,
       'credit_balance', credit_balance
     ) from undone),
    (select jsonb_build_object(
       'valuation_count', coalesce(valuation_count, 0),
       'credit_balance', coalesce(credit_balance, 0)
     ) from public.profiles where user_id = p_user_id)
  );
$$;

create or replace function public.grant_credits(
  p_user_id uuid,
  p_credits integer,
  p_session_id text,
  p_event_id text default null
)
returns jsonb
language sql
volatile
security definer
set search_path = public
as $$
  with ins as (
    insert into public.stripe_events (event_id, session_id, user_id, credits_granted)
    select
      coalesce(nullif(trim(p_event_id), ''), trim(p_session_id)),
      trim(p_session_id),
      p_user_id,
      p_credits
    where p_credits > 0
      and p_session_id is not null
      and length(trim(p_session_id)) > 0
    on conflict do nothing
    returning user_id, credits_granted
  ),
  upsert as (
    insert into public.profiles (user_id, credit_balance)
    select user_id, credits_granted from ins
    on conflict (user_id) do update
      set credit_balance = public.profiles.credit_balance + excluded.credit_balance,
          updated_at = now()
    returning valuation_count, credit_balance
  )
  select coalesce(
    (select jsonb_build_object(
       'valuation_count', valuation_count,
       'credit_balance', credit_balance,
       'granted', true
     ) from upsert),
    (select jsonb_build_object(
       'valuation_count', coalesce(valuation_count, 0),
       'credit_balance', coalesce(credit_balance, 0),
       'granted', false
     ) from public.profiles where user_id = p_user_id),
    jsonb_build_object('valuation_count', 0, 'credit_balance', 0, 'granted', false)
  );
$$;

revoke all on function public.consume_valuation(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_valuation(uuid, integer) to service_role;

revoke all on function public.refund_valuation(uuid, integer) from public, anon, authenticated;
grant execute on function public.refund_valuation(uuid, integer) to service_role;

revoke all on function public.grant_credits(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.grant_credits(uuid, integer, text, text) to service_role;
