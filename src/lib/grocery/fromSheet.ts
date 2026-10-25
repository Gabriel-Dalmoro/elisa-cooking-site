import type { ClientProfile, ClientSelection, WeeklyDish } from '../types/cooking-ops';
import { effectiveRecipe, type DishRecipe } from './recipe';
import type { GroceryInput } from './list';

// Recipe-override key for the client's custom dish (mirrors CUSTOM_DISH_RECIPE_ID in lib/db/selections)
export const CUSTOM_DISH_RECIPE_ID = '__custom__';

/** Where items added by hand on the shopping list show they come from. */
export const EXTRAS_LABEL = 'Ajouté à la main';

/** What the kitchen sheet API returns that the grocery list needs. */
export interface GrocerySheet {
    client: ClientProfile | null;
    selection: ClientSelection | null;
    dishes: WeeklyDish[];
}

/** Each chosen dish's ingredients and steps for this client (their adapted version, else the menu's). */
export function sheetRecipes(sheet: GrocerySheet): Record<string, DishRecipe> {
    const map: Record<string, DishRecipe> = {};
    const sel = sheet.selection;
    const overrideFor = (id: string) => ({ recipe: sel?.recipeOverrides?.[id], ingredients: sel?.ingredientOverrides?.[id] });
    for (const dish of sheet.dishes) {
        map[dish.id] = effectiveRecipe(dish.ingredients || '', (dish.instructions || []).join('\n'), overrideFor(dish.id));
    }
    if (sel?.customDish) map[CUSTOM_DISH_RECIPE_ID] = effectiveRecipe('', '', overrideFor(CUSTOM_DISH_RECIPE_ID));
    return map;
}

/** The grocery list input for one client's session, or null if they haven't chosen yet. */
export function sheetGroceryInput(
    sheet: GrocerySheet,
    persons: number,
    recipes: Record<string, DishRecipe> = sheetRecipes(sheet)
): GroceryInput | null {
    const { client, selection, dishes } = sheet;
    if (!client || !selection) return null;
    return {
        persons,
        dishes: [
            ...dishes.map(d => ({
                name: d.name,
                ingredients: recipes[d.id]?.ingredients || '',
                recipeText: recipes[d.id]?.steps || '',
                clientNote: selection.dishNotes?.[d.id]
            })),
            ...(selection.customDish
                ? [{
                    name: selection.customDish,
                    ingredients: recipes[CUSTOM_DISH_RECIPE_ID]?.ingredients || '',
                    recipeText: recipes[CUSTOM_DISH_RECIPE_ID]?.steps || ''
                }]
                : []),
            // Added by hand on the list: read like recipe lines (aisle, adding up), never scaled
            ...(selection.groceryExtras?.length
                ? [{ name: EXTRAS_LABEL, ingredients: [`Pour ${persons} personnes`, ...selection.groceryExtras].join('\n'), handAdded: true }]
                : [])
        ],
        allergies: client.allergies,
        notes: [
            { label: 'N’aime pas', text: client.dislikes || '' },
            { label: 'Message de la semaine', text: selection.generalNote || '' }
        ]
    };
}
