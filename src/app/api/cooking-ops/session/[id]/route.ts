import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSessionIgnored } from '@/lib/db/sessions';
import { getClientById } from '@/lib/db/clients';
import { getSelection } from '@/lib/db/selections';
import { getMenu } from '@/lib/db/menus';
import { getWeekStartForDate } from '@/lib/dateUtils';
import { requireOwner } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

/**
 * Kitchen sheet for one session: client, allergies, access code, and the dishes the client chose
 * (with Elisa's instructions from that week's menu).
 */
export async function GET(_req: NextRequest, { params }: Params) {
    const denied = await requireOwner();
    if (denied) return denied;

    try {
        const { id } = await params;
        const session = await getSession(id);
        if (!session) {
            return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 });
        }

        const weekStart = getWeekStartForDate(session.dateIso);
        const [client, menu] = await Promise.all([
            session.clientId ? getClientById(session.clientId) : Promise.resolve(null),
            getMenu(weekStart)
        ]);
        const selection = client ? await getSelection(client.id, weekStart) : null;

        // Dishes chosen by the client, in menu order. A chosen dish later removed from the menu
        // is still listed by name so nothing silently disappears from the kitchen sheet.
        const chosenIds = selection?.selectedDishIds || [];
        const dishes = menu.recipes.filter(d => chosenIds.includes(d.id));
        const missingDishNames = chosenIds
            .map((dishId, i) => (menu.recipes.some(d => d.id === dishId) ? null : selection?.selectedDishNames[i] || null))
            .filter((n): n is string => Boolean(n));

        return NextResponse.json({ session, client, selection, dishes, missingDishNames, weekLabel: menu.weekLabel });
    } catch (error) {
        console.error('Error loading session:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
    }
}

/**
 * PATCH { ignored: boolean } → hide a calendar event that isn't a cooking session (kept hidden across syncs)
 */
export async function PATCH(req: NextRequest, { params }: Params) {
    const denied = await requireOwner();
    if (denied) return denied;

    try {
        const { id } = await params;
        const { ignored } = await req.json();
        if (typeof ignored !== 'boolean') {
            return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
        }
        await setSessionIgnored(id, ignored);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating session:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
    }
}
