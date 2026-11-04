-- =========================================================
-- 008 — The recipe bank remembers each dish's diet versions
-- (« Lasagnes » comes back with its sans-gluten / halal versions ready).
-- Run ONCE in Supabase Dashboard > SQL Editor. Additive only, safe to re-run,
-- safe to run before or after the matching code is deployed (until then, versions are
-- simply not remembered in the bank; menus keep them either way).
-- =========================================================

begin;

-- { "variants": [...], "dietOk": [...] }: the versions of the dish for some diets,
-- and the diets Elisa checked the original is fine for
alter table public.recipe_vault add column if not exists diet_versions jsonb;

commit;
