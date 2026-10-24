import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth';
import { createChef, deleteChef, listStaff, resetChefPassword, updateChef } from '@/lib/db/staff';
import { listClients } from '@/lib/db/clients';

/**
 * The team (Elisa only).
 * GET → everyone, with how many clients each chef has
 * POST { displayName, email, phone?, city? } → creates a chef login; returns a temporary password ONCE
 * PATCH { userId, displayName?, phone?, city?, active? } → edit / deactivate / reactivate a chef
 * PATCH { userId, resetPassword: true } → new temporary password (returned once)
 * DELETE ?userId=… → removes a chef for good; their clients and sessions go back to Elisa
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (v: unknown, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined);

export async function GET() {
    const denied = await requireOwner();
    if (denied) return denied;
    try {
        const [staff, clients] = await Promise.all([listStaff(), listClients()]);
        const team = staff.map(member => ({
            ...member,
            clientCount: member.role === 'chef' ? clients.filter(c => c.chefId === member.userId).length : clients.filter(c => !c.chefId).length
        }));
        return NextResponse.json({ team });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;
    try {
        const body = await req.json();
        const displayName = text(body.displayName, 80) || '';
        const email = text(body.email, 200) || '';
        if (!displayName) return NextResponse.json({ error: 'Le nom du chef est requis' }, { status: 400 });
        if (!EMAIL.test(email)) return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
        const result = await createChef({ displayName, email, phone: text(body.phone, 40), city: text(body.city, 80) });
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;
    try {
        const body = await req.json();
        if (typeof body.userId !== 'string' || !body.userId) {
            return NextResponse.json({ error: 'Chef manquant' }, { status: 400 });
        }
        if (body.resetPassword === true) {
            const temporaryPassword = await resetChefPassword(body.userId);
            return NextResponse.json({ success: true, temporaryPassword });
        }
        const chef = await updateChef(body.userId, {
            displayName: text(body.displayName, 80),
            phone: text(body.phone, 40),
            city: text(body.city, 80),
            active: typeof body.active === 'boolean' ? body.active : undefined
        });
        return NextResponse.json({ success: true, chef });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;
    try {
        const userId = new URL(req.url).searchParams.get('userId') || '';
        if (!/^[0-9a-f-]{36}$/i.test(userId)) return NextResponse.json({ error: 'Chef manquant' }, { status: 400 });
        await deleteChef(userId);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
    }
}
