import { NextRequest, NextResponse } from 'next/server';
import { deleteVaultRecipe } from '@/lib/db/vault';
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
