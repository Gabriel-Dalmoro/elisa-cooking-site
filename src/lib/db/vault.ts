import { getSupabaseAdmin } from '../supabase/admin';
import { VaultRecipe, WeeklyDish } from '../types/cooking-ops';

/**
 * Recipe vault: every dish Elisa has ever put on a menu, reusable week after week.
 */

interface VaultRow {
    id: string;
    name: string;
    category: string;
    instructions: unknown;
    chef_notes: string | null;
    times_used: number | null;
    last_used_week: string | null;
    created_at: string;
}

function rowToRecipe(row: VaultRow): VaultRecipe {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        instructions: Array.isArray(row.instructions) ? (row.instructions as string[]) : [],
        chefNotes: row.chef_notes || '',
        timesUsed: row.times_used || 0,
        lastUsedWeek: row.last_used_week || undefined,
        createdAt: row.created_at
    };
}

const nameKey = (name: string) => name.trim().toLowerCase();

export async function listVault(): Promise<VaultRecipe[]> {
    const { data, error } = await getSupabaseAdmin()
        .from('recipe_vault')
        .select('*')
        .order('times_used', { ascending: false })
        .order('name', { ascending: true });
    if (error) throw new Error(`Lecture de la banque de recettes impossible : ${error.message}`);
    return (data as VaultRow[]).map(rowToRecipe);
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

        if (existingId) {
            const update: Record<string, unknown> = { category: dish.category, updated_at: new Date().toISOString() };
            if (instructions.length > 0) update.instructions = instructions;
            if (chefNotes) update.chef_notes = chefNotes;
            const { error: updateError } = await supabase.from('recipe_vault').update(update).eq('id', existingId);
            if (updateError) throw new Error(`Mise à jour de la recette impossible : ${updateError.message}`);
        } else {
            const { data: inserted, error: insertError } = await supabase
                .from('recipe_vault')
                .insert({ name: dish.name.trim(), category: dish.category, instructions, chef_notes: chefNotes || null, times_used: 0 })
                .select('id')
                .single();
            if (insertError) throw new Error(`Ajout de la recette impossible : ${insertError.message}`);
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
