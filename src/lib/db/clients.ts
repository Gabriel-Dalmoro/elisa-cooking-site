import { randomBytes, randomUUID } from 'crypto';
import { getSupabaseAdmin } from '../supabase/admin';
import { ClientProfile } from '../types/cooking-ops';

/**
 * Client CRM data access. Supabase is the single source of truth:
 * every call hits the database, is awaited, and throws on failure.
 */

// Tokens are 32 lowercase hex chars (128 bits), generated server-side
const TOKEN_PATTERN = /^[a-f0-9]{32}$/;

export function isValidClientToken(token: string): boolean {
    return TOKEN_PATTERN.test(token);
}

function generateToken(): string {
    return randomBytes(16).toString('hex');
}

interface ClientRow {
    id: string;
    token: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    access_code: string | null;
    allergies: unknown;
    dislikes: string | null;
    default_dish_count: number | null;
    person_count: number | null;
    notes: string | null;
    private_notes: string | null;
    is_booked_this_week: boolean | null;
    booking_day: string | null;
    created_at: string;
}

function rowToClient(row: ClientRow): ClientProfile {
    return {
        id: row.id,
        token: row.token,
        name: row.name,
        phone: row.phone || '',
        email: row.email || '',
        address: row.address || '',
        accessCode: row.access_code || '',
        allergies: Array.isArray(row.allergies) ? (row.allergies as string[]) : [],
        dislikes: row.dislikes || '',
        defaultDishCount: row.default_dish_count || 4,
        personCount: row.person_count || 2,
        notes: row.notes || '',
        privateNotes: row.private_notes || '',
        isBookedThisWeek: Boolean(row.is_booked_this_week),
        bookingDay: row.booking_day || undefined,
        createdAt: row.created_at
    };
}

export type ClientInput = Partial<Pick<ClientProfile,
    'name' | 'phone' | 'email' | 'address' | 'accessCode' | 'allergies' | 'dislikes' | 'defaultDishCount' | 'personCount' | 'notes' | 'privateNotes'
>>;

// Only fields present in `input` are written, so a form that doesn't show a field can't wipe it
function inputToRow(input: ClientInput): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    if (input.name !== undefined) row.name = input.name.trim();
    if (input.phone !== undefined) row.phone = input.phone.trim();
    if (input.email !== undefined) row.email = input.email.trim();
    if (input.address !== undefined) row.address = input.address.trim();
    if (input.accessCode !== undefined) row.access_code = input.accessCode.trim();
    if (input.allergies !== undefined) row.allergies = input.allergies;
    if (input.dislikes !== undefined) row.dislikes = input.dislikes.trim();
    if (input.defaultDishCount !== undefined) row.default_dish_count = input.defaultDishCount;
    if (input.personCount !== undefined) row.person_count = input.personCount;
    if (input.notes !== undefined) row.notes = input.notes.trim();
    if (input.privateNotes !== undefined) row.private_notes = input.privateNotes.trim();
    return row;
}

export async function listClients(): Promise<ClientProfile[]> {
    const { data, error } = await getSupabaseAdmin()
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw new Error(`Lecture des clients impossible : ${error.message}`);
    return (data as ClientRow[]).map(rowToClient);
}

export async function getClientById(id: string): Promise<ClientProfile | null> {
    const { data, error } = await getSupabaseAdmin()
        .from('clients')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error) throw new Error(`Lecture du client impossible : ${error.message}`);
    return data ? rowToClient(data as ClientRow) : null;
}

/**
 * Exact token match only. No fuzzy matching, no auto-creation.
 */
export async function getClientByToken(token: string): Promise<ClientProfile | null> {
    const clean = token.trim().toLowerCase();
    if (!isValidClientToken(clean)) return null;

    const { data, error } = await getSupabaseAdmin()
        .from('clients')
        .select('*')
        .eq('token', clean)
        .maybeSingle();
    if (error) throw new Error(`Lecture du client impossible : ${error.message}`);
    return data ? rowToClient(data as ClientRow) : null;
}

export async function createClient(input: ClientInput & { name: string }): Promise<ClientProfile> {
    const row = {
        id: `client_${randomUUID()}`,
        token: generateToken(),
        ...inputToRow(input)
    };
    const { data, error } = await getSupabaseAdmin()
        .from('clients')
        .insert(row)
        .select('*')
        .single();
    if (error) throw new Error(`Création du client impossible : ${error.message}`);
    return rowToClient(data as ClientRow);
}

export async function updateClient(id: string, input: ClientInput): Promise<ClientProfile> {
    const row = { ...inputToRow(input), updated_at: new Date().toISOString() };
    const { data, error } = await getSupabaseAdmin()
        .from('clients')
        .update(row)
        .eq('id', id)
        .select('*')
        .maybeSingle();
    if (error) throw new Error(`Mise à jour du client impossible : ${error.message}`);
    if (!data) throw new Error('Client introuvable');
    return rowToClient(data as ClientRow);
}

export async function deleteClient(id: string): Promise<void> {
    const { error } = await getSupabaseAdmin()
        .from('clients')
        .delete()
        .eq('id', id);
    if (error) throw new Error(`Suppression du client impossible : ${error.message}`);
}
