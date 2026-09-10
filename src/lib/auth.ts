import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from './supabase/server';
import { getSupabaseAdmin } from './supabase/admin';

export type StaffRole = 'owner' | 'assistant';

/**
 * Returns the logged-in, active staff member, or null.
 */
export async function getCurrentStaff(): Promise<{ userId: string; role: StaffRole } | null> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: staff, error } = await getSupabaseAdmin()
        .from('staff')
        .select('role, active')
        .eq('user_id', user.id)
        .maybeSingle();

    if (error) {
        console.error('[auth] staff lookup failed:', error.message);
        return null;
    }
    if (!staff || !staff.active) return null;

    return { userId: user.id, role: staff.role as StaffRole };
}

/**
 * Guard for owner-only API routes.
 * Usage: `const denied = await requireOwner(); if (denied) return denied;`
 */
export async function requireOwner(): Promise<NextResponse | null> {
    const staff = await getCurrentStaff();
    if (!staff) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    if (staff.role !== 'owner') {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    return null;
}
