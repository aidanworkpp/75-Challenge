-- 75 Hard tracker — initial schema
-- Assumes Supabase Auth (auth.users) provides the user identity.
-- [A1] One active challenge per user at a time (enforced by partial unique index).
-- [A2] Dates stored as `date` (not timestamptz) — "today" is the user's local calendar day.
-- [A3] Commitment values are per-day rows in daily_log_entries; DailyLog.complete is recomputed on write.

-- ============ profiles ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

-- auto-create profile on signup
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ challenges ============
create type challenge_status as enum ('active', 'completed', 'failed');
create type tier_kind as enum ('hard', 'medium', 'soft', 'custom');

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tier tier_kind not null,
  start_date date not null,
  length_days int not null check (length_days between 1 and 365),
  status challenge_status not null default 'active',
  restart_on_miss boolean not null default false,
  created_at timestamptz not null default now()
);

-- [A1] enforce one active challenge per user
create unique index if not exists challenges_one_active_per_user
  on public.challenges (user_id) where status = 'active';

create index if not exists challenges_user_idx on public.challenges (user_id, start_date desc);

-- ============ commitment_items ============
create type commitment_type as enum ('boolean', 'numeric');
create type commitment_category as enum ('workout', 'diet', 'reading', 'water', 'photo', 'custom');

create table if not exists public.commitment_items (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  label text not null,
  type commitment_type not null,
  target_value numeric,          -- required if type = numeric
  unit text,                     -- e.g. 'min', 'pages', 'L'
  category commitment_category not null default 'custom',
  optional boolean not null default false,  -- [A4] optional items don't gate day-complete
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint numeric_needs_target check (
    (type = 'boolean') or (type = 'numeric' and target_value is not null and target_value > 0)
  )
);

create index if not exists commitment_items_challenge_idx
  on public.commitment_items (challenge_id, sort_order);

-- ============ daily_logs ============
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  log_date date not null,
  complete boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (challenge_id, log_date)
);

create index if not exists daily_logs_challenge_date_idx
  on public.daily_logs (challenge_id, log_date desc);

-- ============ daily_log_entries ============
create table if not exists public.daily_log_entries (
  id uuid primary key default gen_random_uuid(),
  daily_log_id uuid not null references public.daily_logs(id) on delete cascade,
  commitment_item_id uuid not null references public.commitment_items(id) on delete cascade,
  bool_value boolean,
  numeric_value numeric,
  updated_at timestamptz not null default now(),
  unique (daily_log_id, commitment_item_id)
);

-- ============ RLS ============
alter table public.profiles enable row level security;
alter table public.challenges enable row level security;
alter table public.commitment_items enable row level security;
alter table public.daily_logs enable row level security;
alter table public.daily_log_entries enable row level security;

-- profiles
create policy "own profile read"  on public.profiles for select using (auth.uid() = id);
create policy "own profile write" on public.profiles for update using (auth.uid() = id);

-- challenges
create policy "own challenge read"  on public.challenges for select using (auth.uid() = user_id);
create policy "own challenge write" on public.challenges for insert with check (auth.uid() = user_id);
create policy "own challenge update" on public.challenges for update using (auth.uid() = user_id);
create policy "own challenge delete" on public.challenges for delete using (auth.uid() = user_id);

-- commitment_items — via challenge ownership
create policy "own items read" on public.commitment_items for select
  using (exists (select 1 from public.challenges c where c.id = challenge_id and c.user_id = auth.uid()));
create policy "own items write" on public.commitment_items for insert
  with check (exists (select 1 from public.challenges c where c.id = challenge_id and c.user_id = auth.uid()));
create policy "own items update" on public.commitment_items for update
  using (exists (select 1 from public.challenges c where c.id = challenge_id and c.user_id = auth.uid()));
create policy "own items delete" on public.commitment_items for delete
  using (exists (select 1 from public.challenges c where c.id = challenge_id and c.user_id = auth.uid()));

-- daily_logs
create policy "own logs read" on public.daily_logs for select
  using (exists (select 1 from public.challenges c where c.id = challenge_id and c.user_id = auth.uid()));
create policy "own logs write" on public.daily_logs for insert
  with check (exists (select 1 from public.challenges c where c.id = challenge_id and c.user_id = auth.uid()));
create policy "own logs update" on public.daily_logs for update
  using (exists (select 1 from public.challenges c where c.id = challenge_id and c.user_id = auth.uid()));

-- daily_log_entries — via daily_log → challenge ownership
create policy "own entries read" on public.daily_log_entries for select
  using (exists (
    select 1 from public.daily_logs dl
    join public.challenges c on c.id = dl.challenge_id
    where dl.id = daily_log_id and c.user_id = auth.uid()
  ));
create policy "own entries write" on public.daily_log_entries for insert
  with check (exists (
    select 1 from public.daily_logs dl
    join public.challenges c on c.id = dl.challenge_id
    where dl.id = daily_log_id and c.user_id = auth.uid()
  ));
create policy "own entries update" on public.daily_log_entries for update
  using (exists (
    select 1 from public.daily_logs dl
    join public.challenges c on c.id = dl.challenge_id
    where dl.id = daily_log_id and c.user_id = auth.uid()
  ));
create policy "own entries delete" on public.daily_log_entries for delete
  using (exists (
    select 1 from public.daily_logs dl
    join public.challenges c on c.id = dl.challenge_id
    where dl.id = daily_log_id and c.user_id = auth.uid()
  ));
