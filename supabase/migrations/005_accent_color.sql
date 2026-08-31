-- v5: per-user accent colour (additive; existing users default to orange)
alter table public.profiles
  add column if not exists accent text not null default 'orange';
