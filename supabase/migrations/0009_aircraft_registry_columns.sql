-- Staging was created from 0001, which used different column names than the
-- production aircraft table the lookup already reads. Production already has
-- these columns (0001's CREATE TABLE IF NOT EXISTS did not alter it). Adding
-- them here lets one importer payload upsert both projects.
alter table public.aircraft add column if not exists zip_code text;
alter table public.aircraft add column if not exists horsepower text;
alter table public.aircraft add column if not exists speed integer;
alter table public.aircraft add column if not exists num_engines integer;
alter table public.aircraft add column if not exists weight_class text;
alter table public.aircraft add column if not exists status_code text;
alter table public.aircraft add column if not exists cert_issue_date text;
alter table public.aircraft add column if not exists airworth_date text;
alter table public.aircraft add column if not exists mode_s_code text;
alter table public.aircraft add column if not exists mode_s_hex text;
alter table public.aircraft add column if not exists kit_mfr text;
alter table public.aircraft add column if not exists kit_model text;
alter table public.aircraft add column if not exists fract_owner boolean;
alter table public.aircraft add column if not exists updated_at timestamp;
