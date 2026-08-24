-- Feedback was created in production before migrations were tracked.
-- Create it here so a fresh local database can apply this file.
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  email text,
  aircraft text,
  accuracy text,
  message text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.feedback
  add column if not exists user_agent text;
