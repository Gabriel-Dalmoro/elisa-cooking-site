import type { ClientSelection, WeeklyDish } from './types/cooking-ops';
import { normalize } from './grocery/parse';

/**
 * A client's choice points to menu dishes by id. If a dish got a new id after the client chose
 * (re-placed from the recipe bank, or re-typed in its slot), the id no longer matches and the dish
 * would vanish from the kitchen sheet and the shopping list. So a chosen id not found on the menu
 * is matched by the dish name saved with the choice (or one of its diet versions' names).
 */

const sameName = (a: string, b: string) => normalize(a) === normalize(b);

export function findChosenDish(recipes: WeeklyDish[], id: string, savedName?: string): WeeklyDish | undefined {
    const byId = recipes.find(d => d.id === id);
    if (byId || !savedName?.trim()) return byId;
    return recipes.find(d => sameName(d.name, savedName) || (d.variants || []).some(v => sameName(v.name, savedName)));
}

/**
 * The choice with its dish ids lined up on the menu as it is now: notes and diet versions
 * follow their dish. Ids that match nothing (dish really removed) are kept as they are.
 */
export function alignSelectionToMenu<T extends ClientSelection | null>(selection: T, recipes: WeeklyDish[]): T {
    if (!selection) return selection;
    const remap = new Map<string, string>();
    const taken = new Set<string>();
    selection.selectedDishIds.forEach((id, i) => {
        if (recipes.some(d => d.id === id)) { taken.add(id); return; }
        const match = findChosenDish(recipes, id, selection.selectedDishNames[i]);
        if (match && !taken.has(match.id) && !selection.selectedDishIds.includes(match.id)) {
            remap.set(id, match.id);
            taken.add(match.id);
        }
    });
    if (remap.size === 0) return selection;
    const rekey = (record: Record<string, string> | undefined) =>
        record ? Object.fromEntries(Object.entries(record).map(([k, v]) => [remap.get(k) || k, v])) : record;
    return {
        ...selection,
        selectedDishIds: selection.selectedDishIds.map(id => remap.get(id) || id),
        dishNotes: rekey(selection.dishNotes) || {},
        variantIds: rekey(selection.variantIds),
        titleOverrides: rekey(selection.titleOverrides),
        recipeOverrides: rekey(selection.recipeOverrides) || {},
        ingredientOverrides: rekey(selection.ingredientOverrides) || {}
    };
}
