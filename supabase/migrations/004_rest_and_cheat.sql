-- v4: weekly rest-day and cheat-meal allowances
-- [A22] Fully additive — all new columns are defaulted, so existing challenges
--        and daily_logs are unaffected (existing challenges get 0 allowances).
-- [A23] "Week" = challenge-week: days grouped in 7s from the start date
--        (week 1 = days 1–7). Budget is per challenge-week.
-- [A24] Rest day excuses required workout-category items for that date.
--        Cheat meal excuses required diet-category items for that date.

alter table public.challenges
  add column if not exists rest_days_per_week   smallint not null default 0 check (rest_days_per_week   between 0 and 7),
  add column if not exists cheat_meals_per_week  smallint not null default 0 check (cheat_meals_per_week between 0 and 7);

alter table public.daily_logs
  add column if not exists rest_day   boolean not null default false,
  add column if not exists cheat_meal boolean not null default false;
