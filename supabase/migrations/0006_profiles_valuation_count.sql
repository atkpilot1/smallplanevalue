-- Per-account valuation counter (no credit limit yet).
-- The browser may read its own count; only the service role may increment.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  valuation_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

grant select on table public.profiles to authenticated;
grant select, insert, update on table public.profiles to service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;

create or replace function public.increment_valuation_count(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.profiles (user_id, valuation_count)
  values (p_user_id, 1)
  on conflict (user_id) do update
    set valuation_count = public.profiles.valuation_count + 1,
        updated_at = now()
  returning valuation_count into new_count;
  return new_count;
end;
$$;

revoke all on function public.increment_valuation_count(uuid) from public, anon, authenticated;
grant execute on function public.increment_valuation_count(uuid) to service_role;

alter table public.usage_events
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists usage_events_user_feature_created_idx
  on public.usage_events (user_id, feature, created_at desc);

drop policy if exists "anon_insert_usage_events" on public.usage_events;
drop policy if exists "anon_select_usage_events" on public.usage_events;

revoke select, insert on table public.usage_events from anon, authenticated;
grant select, insert on table public.usage_events to service_role;
