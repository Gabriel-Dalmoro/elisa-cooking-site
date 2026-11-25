import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth';
import { setTrackingStart } from '@/lib/db/invoicing';

/** PUT { trackingStart: 'YYYY-MM-DD' } → sessions before it are not tracked (invoiced before the page existed). */
export async function PUT(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;
    try {
        const { trackingStart } = await req.json();
        if (typeof trackingStart !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(trackingStart)) {
            return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
        }
        await setTrackingStart(trackingStart);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
    }
}
