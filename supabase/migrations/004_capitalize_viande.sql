-- =========================================================
-- 004 — "viande" → "Viande" (it was the only lowercase category)
-- Fixes the category everywhere it is stored: the recipe bank and
-- the dishes already saved inside weekly menus.
-- Safe to re-run.
-- =========================================================

begin;

update public.recipe_vault
set category = 'Viande'
where category = 'viande';

update public.weekly_menus
set dishes = (
    select coalesce(jsonb_agg(
        case when dish->>'category' = 'viande'
             then jsonb_set(dish, '{category}', '"Viande"')
             else dish end
    ), '[]'::jsonb)
    from jsonb_array_elements(dishes) as dish
)
where dishes @> '[{"category": "viande"}]'::jsonb;

commit;
