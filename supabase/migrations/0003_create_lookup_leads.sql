-- Email leads from ntailnum / SPV lookup funnel (aircraft metadata only — no owner PII).
create table if not exists public.lookup_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  nnumber text,
  make text,
  model text,
  year integer,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists lookup_leads_created_at_idx on public.lookup_leads (created_at desc);

alter table public.lookup_leads enable row level security;

create policy "anon_insert_lookup_leads"
  on public.lookup_leads
  for insert
  to anon
  with check (true);
