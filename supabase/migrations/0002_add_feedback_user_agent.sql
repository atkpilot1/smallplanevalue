-- Add user_agent column to feedback table for diagnostic context on submissions.
alter table public.feedback
  add column if not exists user_agent text;
