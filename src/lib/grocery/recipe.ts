import { splitRecipe } from './parse';

export interface DishRecipe {
    ingredients: string;
    steps: string;
    adapted: boolean; // Elisa changed it for this client
    autoSplit: boolean; // the ingredients were read from a one-box recipe (« Ingrédients » heading)
}

/**
 * The ingredients and steps that apply to one dish for one client:
 * the client's adapted version if Elisa made one, else the week's menu version.
 * Older recipes saved as one text box still work: their « Ingrédients » section is read out of it.
 */
export function effectiveRecipe(
    menuIngredients: string,
    menuSteps: string,
    override?: { recipe?: string; ingredients?: string }
): DishRecipe {
    const fromOneBox = (text: string) => {
        const split = splitRecipe(text);
        return split.found
            ? { ingredients: split.ingredients, steps: split.steps, autoSplit: true }
            : { ingredients: '', steps: text, autoSplit: false };
    };

    const base = menuIngredients.trim()
        ? { ingredients: menuIngredients, steps: menuSteps, autoSplit: false }
        : fromOneBox(menuSteps);

    if (!override || (override.recipe === undefined && override.ingredients === undefined)) {
        return { ...base, adapted: false };
    }
    if (override.ingredients !== undefined) {
        return { ingredients: override.ingredients, steps: override.recipe ?? base.steps, adapted: true, autoSplit: false };
    }
    // Adapted before ingredients had their own box: one text
    const legacy = fromOneBox(override.recipe || '');
    return legacy.autoSplit
        ? { ...legacy, adapted: true }
        : { ingredients: base.ingredients, steps: override.recipe || '', adapted: true, autoSplit: base.autoSplit };
}
