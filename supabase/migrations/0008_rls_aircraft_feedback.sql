-- Silence rls_disabled_in_public. Access stays as it already is:
-- aircraft is world-readable for N-number lookup; feedback is insert-only.
-- Grants are unchanged (0005). service_role still bypasses RLS (FAA ingest).

alter table public.aircraft enable row level security;

drop policy if exists "aircraft_select_public" on public.aircraft;
create policy "aircraft_select_public"
  on public.aircraft
  for select
  to anon, authenticated
  using (true);

alter table public.feedback enable row level security;

drop policy if exists "feedback_insert_public" on public.feedback;
create policy "feedback_insert_public"
  on public.feedback
  for insert
  to anon, authenticated
  with check (true);
