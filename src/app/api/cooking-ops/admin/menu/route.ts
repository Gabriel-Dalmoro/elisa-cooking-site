import { NextRequest, NextResponse } from 'next/server';
import { DietIssuesError, getMenu, saveMenuDishes, setMenuStatus } from '@/lib/db/menus';
import { listClients } from '@/lib/db/clients';
import { listSessions } from '@/lib/db/sessions';
import { addDaysIso } from '@/lib/db/series';
import { dietsFromAllergies } from '@/lib/diets';
import { listVault } from '@/lib/db/vault';
import { getWeekBounds, isMondayIso } from '@/lib/dateUtils';
import { requireOwner } from '@/lib/auth';
import { MenuStatus } from '@/lib/types/cooking-ops';

function errorResponse(error: unknown, fallback: string) {
    console.error(fallback, error);
    return NextResponse.json({ error: error instanceof Error ? error.message : fallback }, { status: 500 });
}

/**
 * Clients whose diets the menu must suit: regulars (a session in the 8 weeks before) and anyone
 * booked that week, with at least one diet (gluten, pork, halal…).
 */
async function dietClients(weekStart: string) {
    const [clients, sessions] = await Promise.all([
        listClients(),
        listSessions(addDaysIso(weekStart, -56), addDaysIso(weekStart, 6))
    ]);
    const regular = new Set(sessions.map(s => s.clientId).filter(Boolean));
    return clients
        .filter(c => regular.has(c.id) && dietsFromAllergies(c.allergies).length > 0)
        .map(c => ({ name: c.name, allergies: c.allergies }))
        .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

/**
 * GET ?offset=N → the menu of that week (0 = this week) + the recipe vault
 *   + the clients with a diet the menu has to suit (for the « Régimes » panel)
 */
export async function GET(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;

    try {
        const offset = parseInt(new URL(req.url).searchParams.get('offset') || '0', 10) || 0;
        const { startIso } = getWeekBounds(offset);
        const [menu, vault, clients] = await Promise.all([getMenu(startIso), listVault(), dietClients(startIso)]);
        return NextResponse.json({ menu, vault, dietClients: clients });
    } catch (error) {
        return errorResponse(error, 'Erreur lors du chargement du menu');
    }
}

/**
 * PUT { weekStart, dishes } → saves the dishes (status unchanged) and updates the recipe vault
 */
export async function PUT(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;

    try {
        const { weekStart, dishes } = await req.json();
        if (typeof weekStart !== 'string' || !isMondayIso(weekStart)) {
            return NextResponse.json({ error: 'Semaine invalide' }, { status: 400 });
        }
        const menu = await saveMenuDishes(weekStart, dishes);
        return NextResponse.json({ success: true, menu });
    } catch (error) {
        return errorResponse(error, 'Erreur lors de l’enregistrement du menu');
    }
}

/**
 * POST { weekStart, status, force? } → draft | open (clients can choose) | closed (choices locked)
 * Opening answers 409 { dietIssues } while a dish doesn't suit some clients yet; force opens anyway.
 */
export async function POST(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;

    try {
        const { weekStart, status, force } = await req.json();
        if (typeof weekStart !== 'string' || !isMondayIso(weekStart)) {
            return NextResponse.json({ error: 'Semaine invalide' }, { status: 400 });
        }
        if (!['draft', 'open', 'closed'].includes(status)) {
            return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
        }
        const clients = status === 'open' ? await dietClients(weekStart) : undefined;
        const menu = await setMenuStatus(weekStart, status as MenuStatus, { clients, force: force === true });
        return NextResponse.json({ success: true, menu });
    } catch (error) {
        if (error instanceof DietIssuesError) {
            return NextResponse.json({ error: error.message, dietIssues: error.issues }, { status: 409 });
        }
        return errorResponse(error, 'Erreur lors du changement de statut');
    }
}
