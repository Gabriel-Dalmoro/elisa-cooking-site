import { randomBytes } from 'crypto';
import { getSupabaseAdmin } from '../supabase/admin';

/**
 * The team: Elisa (owner) and the chefs who cook under her brand.
 * A chef is a Supabase Auth user + a row in `staff`. Revoking = active false (keeps their history).
 */

export type StaffRole = 'owner' | 'chef';

export interface StaffMember {
    userId: string;
    role: StaffRole;
    displayName: string;
    email: string;
    phone: string;
    city: string;
    active: boolean;
    createdAt: string;
}

interface StaffRow {
    user_id: string;
    role: string;
    display_name: string | null;
    email?: string | null; // migration 006
    phone?: string | null;
    city?: string | null;
    active: boolean;
    created_at: string;
}

function rowToStaff(row: StaffRow): StaffMember {
    return {
        userId: row.user_id,
        // 'assistant' was the pre-006 name of the chef role
        role: row.role === 'owner' ? 'owner' : 'chef',
        displayName: row.display_name || '',
        email: row.email || '',
        phone: row.phone || '',
        city: row.city || '',
        active: row.active,
        createdAt: row.created_at
    };
}

export async function listStaff(): Promise<StaffMember[]> {
    const { data, error } = await getSupabaseAdmin()
        .from('staff')
        .select('*')
        .order('created_at', { ascending: true });
    if (error) throw new Error(`Lecture de l’équipe impossible : ${error.message}`);
    return (data as StaffRow[]).map(rowToStaff);
}

export async function getStaffMember(userId: string): Promise<StaffMember | null> {
    const { data, error } = await getSupabaseAdmin()
        .from('staff')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) throw new Error(`Lecture du membre de l’équipe impossible : ${error.message}`);
    return data ? rowToStaff(data as StaffRow) : null;
}

/** Active chefs only (for assignment pickers). */
export async function listActiveChefs(): Promise<StaffMember[]> {
    return (await listStaff()).filter(s => s.role === 'chef' && s.active);
}

// Easy to read out loud or type on a phone: no 0/O, 1/l/I
const PASSWORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
function temporaryPassword(): string {
    const bytes = randomBytes(12);
    let out = '';
    for (const b of bytes) out += PASSWORD_ALPHABET[b % PASSWORD_ALPHABET.length];
    return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}`;
}

export interface ChefInput {
    displayName: string;
    email: string;
    phone?: string;
    city?: string;
}

/**
 * Creates the chef's login (email + temporary password, already confirmed) and their staff row.
 * Returns the password once: Elisa passes it on, the chef can change it later.
 */
export async function createChef(input: ChefInput): Promise<{ chef: StaffMember; temporaryPassword: string }> {
    const supabase = getSupabaseAdmin();
    const email = input.email.trim().toLowerCase();
    const password = temporaryPassword();

    const { data: created, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: input.displayName.trim() }
    });
    if (authError || !created.user) {
        const exists = /already|registered|exists/i.test(authError?.message || '');
        throw new Error(exists ? 'Un compte existe déjà avec cet email.' : `Création du compte impossible : ${authError?.message || 'erreur inconnue'}`);
    }

    const { data, error } = await supabase
        .from('staff')
        .insert({
            user_id: created.user.id,
            role: 'chef',
            display_name: input.displayName.trim(),
            email,
            phone: (input.phone || '').trim(),
            city: (input.city || '').trim(),
            active: true
        })
        .select('*')
        .single();
    if (error) {
        // Don't leave a login without a staff row behind
        await supabase.auth.admin.deleteUser(created.user.id).catch(() => undefined);
        throw new Error(`Création du chef impossible : ${error.message}`);
    }
    return { chef: rowToStaff(data as StaffRow), temporaryPassword: password };
}

export async function updateChef(
    userId: string,
    input: Partial<ChefInput> & { active?: boolean }
): Promise<StaffMember> {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.displayName !== undefined) row.display_name = input.displayName.trim();
    if (input.phone !== undefined) row.phone = input.phone.trim();
    if (input.city !== undefined) row.city = input.city.trim();
    if (input.active !== undefined) row.active = input.active;

    const { data, error } = await getSupabaseAdmin()
        .from('staff')
        .update(row)
        .eq('user_id', userId)
        .eq('role', 'chef') // the owner's row is never changed from here
        .select('*')
        .maybeSingle();
    if (error) throw new Error(`Mise à jour du chef impossible : ${error.message}`);
    if (!data) throw new Error('Chef introuvable');

    // A deactivated chef is also signed out everywhere and can't sign back in
    if (input.active === false) {
        await getSupabaseAdmin().auth.admin.updateUserById(userId, { ban_duration: '876000h' }).catch(() => undefined);
    } else if (input.active === true) {
        await getSupabaseAdmin().auth.admin.updateUserById(userId, { ban_duration: 'none' }).catch(() => undefined);
    }
    return rowToStaff(data as StaffRow);
}

/** New temporary password for a chef who forgot theirs. */
export async function resetChefPassword(userId: string): Promise<string> {
    const member = await getStaffMember(userId);
    if (!member || member.role !== 'chef') throw new Error('Chef introuvable');
    const password = temporaryPassword();
    const { error } = await getSupabaseAdmin().auth.admin.updateUserById(userId, { password });
    if (error) throw new Error(`Réinitialisation impossible : ${error.message}`);
    return password;
}
