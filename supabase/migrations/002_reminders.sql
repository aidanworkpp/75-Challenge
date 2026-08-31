-- Email reminders — v2 schema additions
-- [A11] Two configurable local-time reminders per user: morning (default 07:00) and evening (default 20:00).
-- [A12] Reminder emails are per-day deduped in email_reminders (one row per user/date/kind).
-- [A13] Timezone stored as an IANA name (e.g. "Europe/London"), auto-set on first login.

alter table public.profiles
  add column if not exists timezone text not null default 'UTC',
  add column if not exists reminder_hour_morning int not null default 7 check (reminder_hour_morning between 0 and 23),
  add column if not exists reminder_hour_evening int not null default 20 check (reminder_hour_evening between 0 and 23),
  add column if not exists reminders_enabled boolean not null default true;

-- Dedup log — cron endpoint checks this before sending
create type reminder_kind as enum ('morning', 'evening');

create table if not exists public.email_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,       -- the user's local date, not UTC
  kind reminder_kind not null,
  sent_at timestamptz not null default now(),
  unique (user_id, local_date, kind)
);

create index if not exists email_reminders_user_idx
  on public.email_reminders (user_id, local_date desc);

alter table public.email_reminders enable row level security;
-- Only the service role reads/writes this — no user policies needed.
-- (The cron route uses SUPABASE_SERVICE_ROLE_KEY.)
