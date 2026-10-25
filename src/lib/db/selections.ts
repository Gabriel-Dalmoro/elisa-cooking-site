import { getSupabaseAdmin } from '../supabase/admin';
import { ClientSelection } from '../types/cooking-ops';

/**
 * Client dish selections: one per client per week.
 */

interface SelectionRow {
    id: string;
    client_id: string;
    week_start: string;
    selected_dish_ids: unknown;
    selected_dish_names: unknown;
    dish_notes: unknown;
    general_note: string | null;
    allergies_at_submission: unknown;
    allergies_added: unknown;
    submitted_at: string;
}

// The client's own dish request is stored alongside the dish notes (no extra column needed)
const CUSTOM_DISH_KEY = '__custom_dish__';
// When that dish was picked from an earlier menu of the season: the week it was on (Monday)
const CUSTOM_DISH_FROM_KEY = '__custom_dish_from__';
// Same for Elisa's recipes adapted for this one client (dish id → recipe text). Never sent to the client.
const RECIPE_OVERRIDES_KEY = '__recipe_overrides__';
// And their ingredient lists (dish id → ingredient text), read by the client's grocery list
const INGREDIENT_OVERRIDES_KEY = '__ingredient_overrides__';
// And the grocery items Elisa ticked off (bought, or the client already has them), saved with the Save button
const GROCERY_CHECKED_KEY = '__grocery_checked__';
// And the quantities Elisa corrected by hand on the list (item key → amount as she typed it)
const GROCERY_EDITS_KEY = '__grocery_edits__';
// And items added by hand straight on the list (one line each, e.g. « 2 citrons »)
const GROCERY_EXTRAS_KEY = '__grocery_extras__';
// Key used in the recipe overrides for the client's custom dish (it has no menu dish id)
export const CUSTOM_DISH_RECIPE_ID = '__custom__';

const asStringArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

function asStringRecord(v: unknown): Record<string, string> {
    const out: Record<string, string> = {};
    if (v && typeof v === 'object') {
        for (const [id, text] of Object.entries(v)) if (typeof text === 'string') out[id] = text;
    }
    return out;
}

function rowToSelection(row: SelectionRow): ClientSelection {
    const notes = row.dish_notes && typeof row.dish_notes === 'object' ? { ...(row.dish_notes as Record<string, unknown>) } : {};
    const customDish = typeof notes[CUSTOM_DISH_KEY] === 'string' ? notes[CUSTOM_DISH_KEY] : '';
    const customDishFrom = typeof notes[CUSTOM_DISH_FROM_KEY] === 'string' ? notes[CUSTOM_DISH_FROM_KEY] : undefined;
    const recipeOverrides = asStringRecord(notes[RECIPE_OVERRIDES_KEY]);
    const ingredientOverrides = asStringRecord(notes[INGREDIENT_OVERRIDES_KEY]);
    const groceryChecked = asStringArray(notes[GROCERY_CHECKED_KEY]);
    const groceryEdits = asStringRecord(notes[GROCERY_EDITS_KEY]);
    const groceryExtras = asStringArray(notes[GROCERY_EXTRAS_KEY]);
    delete notes[CUSTOM_DISH_KEY];
    delete notes[CUSTOM_DISH_FROM_KEY];
    delete notes[RECIPE_OVERRIDES_KEY];
    delete notes[INGREDIENT_OVERRIDES_KEY];
    delete notes[GROCERY_CHECKED_KEY];
    delete notes[GROCERY_EDITS_KEY];
    delete notes[GROCERY_EXTRAS_KEY];
    const dishNotes: Record<string, string> = {};
    for (const [id, note] of Object.entries(notes)) if (typeof note === 'string') dishNotes[id] = note;
    return {
        id: row.id,
        clientId: row.client_id,
        weekStart: row.week_start,
        selectedDishIds: asStringArray(row.selected_dish_ids),
        selectedDishNames: asStringArray(row.selected_dish_names),
        dishNotes,
        customDish,
        customDishFrom,
        recipeOverrides,
        ingredientOverrides,
        groceryChecked,
        groceryEdits,
        groceryExtras,
        generalNote: row.general_note || '',
        submittedAt: row.submitted_at,
        allergiesAtSubmission: asStringArray(row.allergies_at_submission),
        allergiesAdded: asStringArray(row.allergies_added)
    };
}

export async function getSelectionsForWeek(weekStart: string): Promise<ClientSelection[]> {
    const { data, error } = await getSupabaseAdmin()
        .from('client_selections')
        .select('*')
        .eq('week_start', weekStart);
    if (error) throw new Error(`Lecture des choix clients impossible : ${error.message}`);
    return (data as SelectionRow[]).map(rowToSelection);
}

export async function getSelection(clientId: string, weekStart: string): Promise<ClientSelection | null> {
    const { data, error } = await getSupabaseAdmin()
        .from('client_selections')
        .select('*')
        .eq('client_id', clientId)
        .eq('week_start', weekStart)
        .maybeSingle();
    if (error) throw new Error(`Lecture du choix client impossible : ${error.message}`);
    return data ? rowToSelection(data as SelectionRow) : null;
}

/**
 * Removes a client's choices for a week, so their link lets them choose again (Elisa only).
 */
export async function deleteSelection(clientId: string, weekStart: string): Promise<void> {
    const { error } = await getSupabaseAdmin()
        .from('client_selections')
        .delete()
        .eq('client_id', clientId)
        .eq('week_start', weekStart);
    if (error) throw new Error(`Suppression des choix impossible : ${error.message}`);
}

/**
 * Creates or replaces the client's choices for that week (a re-submission updates, never duplicates).
 */
export async function upsertSelection(input: {
    clientId: string;
    weekStart: string;
    selectedDishIds: string[];
    selectedDishNames: string[];
    dishNotes: Record<string, string>;
    customDish: string;
    customDishFrom?: string;
    generalNote: string;
    allergiesAtSubmission: string[];
    allergiesAdded: string[];
}): Promise<ClientSelection> {
    const now = new Date().toISOString();
    const { data, error } = await getSupabaseAdmin()
        .from('client_selections')
        .upsert({
            client_id: input.clientId,
            week_start: input.weekStart,
            selected_dish_ids: input.selectedDishIds,
            selected_dish_names: input.selectedDishNames,
            dish_notes: input.customDish
                ? {
                    ...input.dishNotes,
                    [CUSTOM_DISH_KEY]: input.customDish,
                    ...(input.customDishFrom ? { [CUSTOM_DISH_FROM_KEY]: input.customDishFrom } : {})
                }
                : input.dishNotes,
            general_note: input.generalNote,
            allergies_at_submission: input.allergiesAtSubmission,
            allergies_added: input.allergiesAdded,
            submitted_at: now,
            updated_at: now
        }, { onConflict: 'client_id,week_start' })
        .select('*')
        .single();
    if (error) throw new Error(`Enregistrement des choix impossible : ${error.message}`);
    return rowToSelection(data as SelectionRow);
}

/**
 * Saves Elisa's recipe for one dish, for this client only (the menu and the recipe bank are untouched):
 * the steps and, when given, the ingredient list. Both empty removes the adaptation,
 * so the sheet falls back to the menu recipe.
 */
export async function setRecipeOverride(
    clientId: string,
    weekStart: string,
    dishId: string,
    recipe: string,
    ingredients?: string
): Promise<ClientSelection> {
    const supabase = getSupabaseAdmin();
    const { data: row, error: readError } = await supabase
        .from('client_selections')
        .select('dish_notes')
        .eq('client_id', clientId)
        .eq('week_start', weekStart)
        .maybeSingle();
    if (readError) throw new Error(`Lecture du choix client impossible : ${readError.message}`);
    if (!row) throw new Error('Ce client n’a pas encore envoyé ses choix pour cette semaine.');

    const notes = row.dish_notes && typeof row.dish_notes === 'object' ? { ...(row.dish_notes as Record<string, unknown>) } : {};
    const overrides = asStringRecord(notes[RECIPE_OVERRIDES_KEY]);
    const ingredientOverrides = asStringRecord(notes[INGREDIENT_OVERRIDES_KEY]);
    const reset = !recipe.trim() && !ingredients?.trim();
    if (reset) {
        delete overrides[dishId];
        delete ingredientOverrides[dishId];
    } else {
        overrides[dishId] = recipe.trim();
        if (ingredients !== undefined) ingredientOverrides[dishId] = ingredients.trim();
    }
    notes[RECIPE_OVERRIDES_KEY] = overrides;
    notes[INGREDIENT_OVERRIDES_KEY] = ingredientOverrides;

    const { data, error } = await supabase
        .from('client_selections')
        .update({ dish_notes: notes, updated_at: new Date().toISOString() })
        .eq('client_id', clientId)
        .eq('week_start', weekStart)
        .select('*')
        .single();
    if (error) throw new Error(`Enregistrement de la recette impossible : ${error.message}`);
    return rowToSelection(data as SelectionRow);
}

/**
 * Saves this client's grocery list state for the week: ticked items, quantities corrected by hand,
 * items added by hand.
 * Only what is given is changed.
 */
export async function setGroceryState(
    clientId: string,
    weekStart: string,
    state: { checked?: string[]; edits?: Record<string, string>; extras?: string[] }
): Promise<ClientSelection> {
    const supabase = getSupabaseAdmin();
    const { data: row, error: readError } = await supabase
        .from('client_selections')
        .select('dish_notes')
        .eq('client_id', clientId)
        .eq('week_start', weekStart)
        .maybeSingle();
    if (readError) throw new Error(`Lecture du choix client impossible : ${readError.message}`);
    if (!row) throw new Error('Ce client n’a pas encore envoyé ses choix pour cette semaine.');

    const notes = row.dish_notes && typeof row.dish_notes === 'object' ? { ...(row.dish_notes as Record<string, unknown>) } : {};
    if (state.checked) notes[GROCERY_CHECKED_KEY] = [...new Set(state.checked)];
    if (state.edits) notes[GROCERY_EDITS_KEY] = state.edits;
    if (state.extras) notes[GROCERY_EXTRAS_KEY] = state.extras;

    const { data, error } = await supabase
        .from('client_selections')
        .update({ dish_notes: notes, updated_at: new Date().toISOString() })
        .eq('client_id', clientId)
        .eq('week_start', weekStart)
        .select('*')
        .single();
    if (error) throw new Error(`Enregistrement de la liste impossible : ${error.message}`);
    return rowToSelection(data as SelectionRow);
}
