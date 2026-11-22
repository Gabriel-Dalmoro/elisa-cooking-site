import { NextRequest, NextResponse } from 'next/server';
import { deleteVaultRecipe, updateVaultRecipeDetails } from '@/lib/db/vault';
import { requireOwner } from '@/lib/auth';

/**
 * Removes a recipe from the bank. Menus that already use it are untouched
 * (a menu keeps its own copy of the dish).
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const denied = await requireOwner();
    if (denied) return denied;

    try {
        const { id } = await params;
        await deleteVaultRecipe(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting vault recipe:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
    }
}

/** PATCH { seasons?, freezable?, fridgeDays? } → a recipe's seasons and how it keeps. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const denied = await requireOwner();
    if (denied) return denied;
    try {
        const { id } = await params;
        const body = await req.json();
        const patch: Parameters<typeof updateVaultRecipeDetails>[1] = {};
        if (Array.isArray(body.seasons)) patch.seasons = body.seasons;
        if (body.freezable === null || typeof body.freezable === 'boolean') patch.freezable = body.freezable;
        if (body.fridgeDays !== undefined) patch.fridgeDays = body.fridgeDays;
        return NextResponse.json({ success: true, recipe: await updateVaultRecipeDetails(id, patch) });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 400 });
    }
}
