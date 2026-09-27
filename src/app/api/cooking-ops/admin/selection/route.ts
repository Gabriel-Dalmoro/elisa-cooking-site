import { NextRequest, NextResponse } from 'next/server';
import { deleteSelection } from '@/lib/db/selections';
import { isMondayIso } from '@/lib/dateUtils';
import { requireOwner } from '@/lib/auth';

/**
 * DELETE ?clientId=…&weekStart=YYYY-MM-DD → clears a client's choices for that week,
 * so their link lets them choose again (clients can't change choices themselves once sent).
 */
export async function DELETE(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;

    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get('clientId') || '';
        const weekStart = searchParams.get('weekStart') || '';
        if (!clientId || !isMondayIso(weekStart)) {
            return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
        }
        await deleteSelection(clientId, weekStart);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting selection:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
    }
}
