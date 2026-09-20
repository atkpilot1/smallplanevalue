-- Local (and hosted) PostgREST uses the anon role. Table privileges are
-- separate from RLS policies; without these grants the API returns 401.
grant select on table public.aircraft to anon, authenticated;

grant insert on table public.feedback to anon, authenticated;

grant insert on table public.lookup_leads to anon, authenticated;

grant select, insert on table public.usage_events to anon, authenticated;
