import { NextRequest, NextResponse } from 'next/server';
import { loadWeekOverview, syncWeekFromCalendar } from '@/lib/cookingOps';
import { requireOwner } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;

    try {
        const { searchParams } = new URL(request.url);
        const offsetParam = searchParams.get('offset') ?? searchParams.get('week');
        let offsetWeeks = 0;
        if (offsetParam === 'next') {
            offsetWeeks = 1;
        } else if (offsetParam !== null && offsetParam !== 'current') {
            const parsed = parseInt(offsetParam, 10);
            offsetWeeks = isNaN(parsed) ? 0 : parsed;
        }

        const sync = await syncWeekFromCalendar(offsetWeeks);
        const overview = await loadWeekOverview(offsetWeeks);

        // If Google failed, still return the last stored sessions so the planning stays usable
        return NextResponse.json({ success: sync.ok, ...sync, ...overview }, { status: sync.ok ? 200 : 502 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erreur';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
