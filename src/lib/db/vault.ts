import { getSupabaseAdmin } from '../supabase/admin';
import { cleanFridgeDays, DishVariant, isSeason, VaultRecipe, WeeklyDish } from '../types/cooking-ops';

/**
 * Recipe vault: every dish Elisa has ever put on a menu, reusable week after week.
 */

interface VaultRow {
    id: string;
    name: string;
    category: string;
    ingredients?: string | null; // added by migration 005
    diet_versions?: { variants?: unknown; dietOk?: unknown } | null; // added by migration 008
    instructions: unknown;
    chef_notes: string | null;
    times_used: number | null;
    last_used_week: string | null;
    created_at: string;
    freezable?: boolean | null; // migration 011
    fridge_days?: number | null; // migration 011
    seasons?: string[] | null; // migration 011
}

function rowToRecipe(row: VaultRow): VaultRecipe {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        ingredients: row.ingredients || '',
        instructions: Array.isArray(row.instructions) ? (row.instructions as string[]) : [],
        chefNotes: row.chef_notes || '',
        timesUsed: row.times_used || 0,
        lastUsedWeek: row.last_used_week || undefined,
        createdAt: row.created_at,
        variants: Array.isArray(row.diet_versions?.variants) ? (row.diet_versions!.variants as DishVariant[]) : [],
        dietOk: Array.isArray(row.diet_versions?.dietOk) ? (row.diet_versions!.dietOk as string[]) : [],
        freezable: typeof row.freezable === 'boolean' ? row.freezable : null,
        fridgeDays: cleanFridgeDays(row.fridge_days),
        seasons: Array.isArray(row.seasons) ? row.seasons.filter(isSeason) : []
    };
}

const nameKey = (name: string) => name.trim().toLowerCase();

// Migrations 005 / 008 add recipe_vault.ingredients / diet_versions. Until they have been run,
// saves leave those fields out instead of failing (the week's menu still keeps them).
const OPTIONAL_COLUMNS = ['ingredients', 'diet_versions', 'freezable', 'fridge_days', 'seasons'] as const;
const missingOptionalColumn = (e: { code?: string; message?: string } | null) =>
    e && (e.code === 'PGRST204' || e.code === '42703')
        ? OPTIONAL_COLUMNS.find(c => (e.message || '').includes(c)) || null
        : null;

/** Writes a row, dropping an optional column the database doesn't have yet. */
export async function writeWithoutMissingColumns<T>(
    row: Record<string, unknown>,
    write: (row: Record<string, unknown>) => PromiseLike<{ data: T | null; error: { code?: string; message?: string } | null }>
) {
    let result = await write(row);
    for (let i = 0; i < OPTIONAL_COLUMNS.length; i++) {
        const missing = missingOptionalColumn(result.error);
        if (!missing || !(missing in row)) break;
        delete row[missing];
        result = await write(row);
    }
    return result;
}

export async function listVault(): Promise<VaultRecipe[]> {
    const { data, error } = await getSupabaseAdmin()
        .from('recipe_vault')
        .select('*')
        .order('times_used', { ascending: false })
        .order('name', { ascending: true });
    if (error) throw new Error(`Lecture de la banque de recettes impossible : ${error.message}`);
    const chosen = await choiceCountsByName();
    return (data as VaultRow[]).map(row => ({ ...rowToRecipe(row), chosenCount: chosen.get(nameKey(row.name)) || 0 }));
}

/**
 * Keeps the vault in sync with a saved menu: new dish names are added, and instructions /
 * chef notes typed for a dish are saved onto its vault recipe (matched by name).
 * Empty instructions never overwrite existing ones.
 */
export async function saveDishesToVault(dishes: WeeklyDish[]): Promise<void> {
    if (dishes.length === 0) return;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.from('recipe_vault').select('id, name');
    if (error) throw new Error(`Lecture de la banque de recettes impossible : ${error.message}`);
    const idByName = new Map((data as { id: string; name: string }[]).map(r => [nameKey(r.name), r.id]));

    for (const dish of dishes) {
        const existingId = idByName.get(nameKey(dish.name));
        const instructions = (dish.instructions || []).filter(s => s.trim().length > 0);
        const chefNotes = (dish.chefNotes || '').trim();
        const ingredients = (dish.ingredients || '').trim();
        // Diet versions are remembered with the recipe (like the steps, never erased by an empty save)
        const dietVersions = (dish.variants?.length || dish.dietOk?.length)
            ? { variants: dish.variants || [], dietOk: dish.dietOk || [] }
            : null;

        if (existingId) {
            const update: Record<string, unknown> = { category: dish.category, updated_at: new Date().toISOString() };
            if (instructions.length > 0) update.instructions = instructions;
            if (chefNotes) update.chef_notes = chefNotes;
            if (ingredients) update.ingredients = ingredients;
            if (dietVersions) update.diet_versions = dietVersions;
            // How it keeps: remembered for next time (an unset value never erases a saved one)
            if (typeof dish.freezable === 'boolean') update.freezable = dish.freezable;
            if (dish.fridgeDays) update.fridge_days = dish.fridgeDays;
            const { error: updateError } = await writeWithoutMissingColumns(update, r => supabase.from('recipe_vault').update(r).eq('id', existingId));
            if (updateError) throw new Error(`Mise à jour de la recette impossible : ${updateError.message}`);
        } else {
            const row: Record<string, unknown> = { name: dish.name.trim(), category: dish.category, instructions, chef_notes: chefNotes || null, times_used: 0 };
            if (ingredients) row.ingredients = ingredients;
            if (dietVersions) row.diet_versions = dietVersions;
            if (typeof dish.freezable === 'boolean') row.freezable = dish.freezable;
            if (dish.fridgeDays) row.fridge_days = dish.fridgeDays;
            const { data: inserted, error: insertError } = await writeWithoutMissingColumns<{ id: string }>(row, r => supabase.from('recipe_vault').insert(r).select('id').single());
            if (insertError || !inserted) throw new Error(`Ajout de la recette impossible : ${insertError?.message}`);
            idByName.set(nameKey(dish.name), inserted.id);
        }
    }
}

/**
 * Counts a use of each dish for the given week (once per week, even if the menu is re-opened).
 */
export async function markDishesUsed(dishNames: string[], weekStart: string): Promise<void> {
    if (dishNames.length === 0) return;
    const supabase = getSupabaseAdmin();
    const wanted = new Set(dishNames.map(nameKey));

    const { data, error } = await supabase.from('recipe_vault').select('id, name, times_used, last_used_week');
    if (error) throw new Error(`Lecture de la banque de recettes impossible : ${error.message}`);

    for (const row of data as { id: string; name: string; times_used: number | null; last_used_week: string | null }[]) {
        if (!wanted.has(nameKey(row.name)) || row.last_used_week === weekStart) continue;
        const { error: updateError } = await supabase
            .from('recipe_vault')
            .update({ times_used: (row.times_used || 0) + 1, last_used_week: weekStart })
            .eq('id', row.id);
        if (updateError) throw new Error(`Mise à jour de la recette impossible : ${updateError.message}`);
    }
}

export async function deleteVaultRecipe(id: string): Promise<void> {
    const { error } = await getSupabaseAdmin()
        .from('recipe_vault')
        .delete()
        .eq('id', id);
    if (error) throw new Error(`Suppression de la recette impossible : ${error.message}`);
}

/** Seasons and how it keeps, set from the recipe bank (migration 011). */
export async function updateVaultRecipeDetails(
    id: string,
    patch: { seasons?: string[]; freezable?: boolean | null; fridgeDays?: number | null }
): Promise<VaultRecipe> {
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.seasons !== undefined) update.seasons = [...new Set(patch.seasons.filter(isSeason))];
    if (patch.freezable !== undefined) update.freezable = patch.freezable;
    if (patch.fridgeDays !== undefined) update.fridge_days = cleanFridgeDays(patch.fridgeDays);
    const { data, error } = await getSupabaseAdmin().from('recipe_vault').update(update).eq('id', id).select('*').single();
    if (error) {
        if (error.code === 'PGRST204' || error.code === '42703') throw new Error('Lancez la migration 011 dans Supabase pour enregistrer les saisons.');
        throw new Error(`Mise à jour de la recette impossible : ${error.message}`);
    }
    return rowToRecipe(data as VaultRow);
}

/**
 * How many times clients picked each dish, across every week (by dish name, so a dish put back on
 * a later menu adds up). Read from the clients' sent choices.
 */
export async function choiceCountsByName(): Promise<Map<string, number>> {
    const { data, error } = await getSupabaseAdmin().from('client_selections').select('selected_dish_names');
    const counts = new Map<string, number>();
    if (error) return counts; // popularity is a bonus: never block the bank for it
    for (const row of data as { selected_dish_names: unknown }[]) {
        if (!Array.isArray(row.selected_dish_names)) continue;
        for (const name of new Set(row.selected_dish_names.filter((n): n is string => typeof n === 'string').map(nameKey))) {
            counts.set(name, (counts.get(name) || 0) + 1);
        }
    }
    return counts;
}
