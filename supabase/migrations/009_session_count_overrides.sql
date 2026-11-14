-- =========================================================
-- 009 — One-off number of people / dishes for a single session
-- (e.g. guests one weekend: 4 people this time, the client's profile stays at 2).
-- Run ONCE in Supabase Dashboard > SQL Editor. Additive only, safe to re-run,
-- safe to run before the matching code is deployed.
-- =========================================================

begin;

-- null = the client's profile applies (the normal case)
alter table public.cooking_sessions add column if not exists person_count_override integer
    check (person_count_override is null or person_count_override between 1 and 20);
alter table public.cooking_sessions add column if not exists dish_count_override integer
    check (dish_count_override is null or dish_count_override between 1 and 12);

commit;
