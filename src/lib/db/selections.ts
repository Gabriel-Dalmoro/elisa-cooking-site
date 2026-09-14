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

const asStringArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

function rowToSelection(row: SelectionRow): ClientSelection {
    return {
        id: row.id,
        clientId: row.client_id,
        weekStart: row.week_start,
        selectedDishIds: asStringArray(row.selected_dish_ids),
        selectedDishNames: asStringArray(row.selected_dish_names),
        dishNotes: row.dish_notes && typeof row.dish_notes === 'object' ? (row.dish_notes as Record<string, string>) : {},
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
 * Creates or replaces the client's choices for that week (a re-submission updates, never duplicates).
 */
export async function upsertSelection(input: {
    clientId: string;
    weekStart: string;
    selectedDishIds: string[];
    selectedDishNames: string[];
    dishNotes: Record<string, string>;
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
            dish_notes: input.dishNotes,
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
