-- Production was created before this column existed. CREATE TABLE IF NOT EXISTS
-- in 0001 does not add it to a table that is already there, and PostgREST
-- rejects the weekly FAA upsert with PGRST204 until the column exists.
alter table public.aircraft add column if not exists airworthiness text;
