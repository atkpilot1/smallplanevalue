-- Track feature usage for tiered pricing (Phase 1: valuation monthly limit).
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  email text,
  feature text not null default 'valuate',
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_client_feature_created_idx
  on public.usage_events (client_id, feature, created_at desc);

alter table public.usage_events enable row level security;

create policy "anon_insert_usage_events"
  on public.usage_events
  for insert
  to anon
  with check (true);

create policy "anon_select_usage_events"
  on public.usage_events
  for select
  to anon
  using (true);
