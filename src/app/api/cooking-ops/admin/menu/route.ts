import { NextRequest, NextResponse } from 'next/server';
import { getMenu, saveMenuDishes, setMenuStatus } from '@/lib/db/menus';
import { listVault } from '@/lib/db/vault';
import { getWeekBounds, isMondayIso } from '@/lib/dateUtils';
import { requireOwner } from '@/lib/auth';
import { MenuStatus } from '@/lib/types/cooking-ops';

function errorResponse(error: unknown, fallback: string) {
    console.error(fallback, error);
    return NextResponse.json({ error: error instanceof Error ? error.message : fallback }, { status: 500 });
}

/**
 * GET ?offset=N → the menu of that week (0 = this week) + the recipe vault
 */
export async function GET(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;

    try {
        const offset = parseInt(new URL(req.url).searchParams.get('offset') || '0', 10) || 0;
        const { startIso } = getWeekBounds(offset);
        const [menu, vault] = await Promise.all([getMenu(startIso), listVault()]);
        return NextResponse.json({ menu, vault });
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
 * POST { weekStart, status } → draft | open (clients can choose) | closed (choices locked)
 */
export async function POST(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;

    try {
        const { weekStart, status } = await req.json();
        if (typeof weekStart !== 'string' || !isMondayIso(weekStart)) {
            return NextResponse.json({ error: 'Semaine invalide' }, { status: 400 });
        }
        if (!['draft', 'open', 'closed'].includes(status)) {
            return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
        }
        const menu = await setMenuStatus(weekStart, status as MenuStatus);
        return NextResponse.json({ success: true, menu });
    } catch (error) {
        return errorResponse(error, 'Erreur lors du changement de statut');
    }
}
