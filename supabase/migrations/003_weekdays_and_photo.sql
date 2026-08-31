-- v3: weekday scheduling + convert everything to boolean tracking
-- [A16] active_weekdays: null = every day; non-null = only on those weekdays (0=Sunday...6=Saturday)
-- [A17] Daily tracking is checkbox-only; numeric target on the item is descriptive
--        (e.g. "Workout — 45 min"). Existing numeric entries are treated as complete.

alter table public.commitment_items
  add column if not exists active_weekdays smallint[] null;

-- Any existing entries with numeric_value set are treated as "done" going forward
update public.daily_log_entries
   set bool_value = true
 where bool_value is null and numeric_value is not null;
