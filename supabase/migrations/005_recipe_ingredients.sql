-- =========================================================
-- 005 — Recipe bank: separate ingredient list
-- The grocery list reads each dish's ingredients. Weekly menus keep them
-- inside their dishes JSON (no change needed there); the recipe bank
-- gets its own column so a reused recipe comes back with its ingredients.
-- Additive only, safe to re-run.
-- =========================================================

alter table public.recipe_vault add column if not exists ingredients text;
