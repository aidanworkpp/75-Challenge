-- Email reminders — v2 schema additions (single daily afternoon reminder)
-- [A11] One reminder per user per day, sent by a daily Vercel Cron.
-- [A12] Dedup enforced by unique (user_id, log_date) in email_reminders.
-- [A13] No per-user timezone — cron runs once at a UTC time set in vercel.json.
--       Assumes the team is roughly in one timezone; pick a UTC hour that maps
--       to a suitable local afternoon for that team.

alter table public.profiles
  add column if not exists reminders_enabled boolean not null default true;

create table if not exists public.email_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  sent_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create index if not exists email_reminders_user_idx
  on public.email_reminders (user_id, log_date desc);

alter table public.email_reminders enable row level security;
-- Service role only — cron uses SUPABASE_SERVICE_ROLE_KEY.
