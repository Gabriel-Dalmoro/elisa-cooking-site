import { NextRequest, NextResponse } from 'next/server';
import { loadWeekOverview, syncWeekFromCalendar } from '@/lib/cookingOps';
import { requireStaff } from '@/lib/auth';
import { isOwner } from '@/lib/access';

/**
 * Syncs Elisa's Google Calendar for a week, then returns the week.
 * A chef has no Google Calendar: they just get their own week (nothing is synced).
 */
export async function GET(request: NextRequest) {
    const { staff, denied } = await requireStaff();
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

        if (!isOwner(staff)) {
            return NextResponse.json({ success: true, chefView: true, ...(await loadWeekOverview(offsetWeeks, staff.userId)) });
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
