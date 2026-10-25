import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createSupabaseServerClient } from './supabase/server';
import { getSupabaseAdmin } from './supabase/admin';
import { isPreviewWithoutLogin, PREVIEW_AS_COOKIE, PREVIEW_STAFF } from './previewAccess';

/**
 * owner = Elisa: everything. chef = a chef cooking under her brand: only the clients and sessions
 * assigned to them, never the business tools (prices, gift cards, Instagram, Airbnb pages, team).
 */
export type StaffRole = 'owner' | 'chef';

export interface CurrentStaff {
    userId: string;
    role: StaffRole;
    displayName: string | null;
    email: string | null;
    isPreview?: boolean; // preview deployment without login (never in production)
}

async function loadStaff(userId: string): Promise<CurrentStaff | null> {
    const { data: staff, error } = await getSupabaseAdmin()
        .from('staff')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) {
        console.error('[auth] staff lookup failed:', error.message);
        return null;
    }
    if (!staff || !staff.active) return null;
    return {
        userId,
        // 'assistant' was the pre-006 name of the chef role
        role: staff.role === 'owner' ? 'owner' : 'chef',
        displayName: staff.display_name || null,
        email: staff.email || null
    };
}

/**
 * Returns the logged-in, active staff member, or null.
 */
export async function getCurrentStaff(): Promise<CurrentStaff | null> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return loadStaff(user.id);

    // Preview deployments (not main): no login. Acts as Elisa, or as a chef picked with
    // « Voir comme » to test what they see. Production never gets here.
    if (!isPreviewWithoutLogin((await headers()).get('host'))) return null;
    const viewAs = (await cookies()).get(PREVIEW_AS_COOKIE)?.value;
    if (viewAs && /^[0-9a-f-]{36}$/i.test(viewAs)) {
        const chef = await loadStaff(viewAs);
        if (chef?.role === 'chef') return { ...chef, isPreview: true };
    }
    return { ...PREVIEW_STAFF, email: null, isPreview: true };
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

/**
 * Guard for routes open to the whole team (owner and chefs). Each route then limits a chef
 * to what is assigned to them (see lib/access.ts).
 * Usage: `const { staff, denied } = await requireStaff(); if (denied) return denied;`
 */
export async function requireStaff(): Promise<{ staff: CurrentStaff; denied: null } | { staff: null; denied: NextResponse }> {
    const staff = await getCurrentStaff();
    if (!staff) return { staff: null, denied: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) };
    return { staff, denied: null };
}
