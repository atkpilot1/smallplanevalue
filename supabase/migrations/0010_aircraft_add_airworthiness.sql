-- Production's aircraft table predates 0001 and has no `airworthiness` column
-- (it uses airworth_date instead). The FAA importer failed with PGRST204
-- ("Could not find the 'airworthiness' column of 'aircraft'"). Add it so the
-- same payload upserts into both staging and production. No-op where it exists.
alter table public.aircraft add column if not exists airworthiness text;

-- Ask PostgREST to reload its schema cache so the new column is visible immediately.
notify pgrst, 'reload schema';
