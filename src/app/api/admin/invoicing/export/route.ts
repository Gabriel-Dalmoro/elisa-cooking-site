import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth';
import { exportRows } from '@/lib/db/invoicing';
import { toCsv } from '@/lib/invoicing/logic';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** GET ?from=YYYY-MM-DD&to=YYYY-MM-DD → CSV of every session in the range with its billing status. */
export async function GET(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;
    const p = new URL(req.url).searchParams;
    const from = p.get('from') || '';
    const to = p.get('to') || '';
    if (!ISO_DATE.test(from) || !ISO_DATE.test(to) || from > to) {
        return NextResponse.json({ error: 'Dates invalides' }, { status: 400 });
    }
    try {
        const csv = toCsv(await exportRows(from, to));
        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="facturation-${from}-au-${to}.csv"`,
                'Cache-Control': 'no-store'
            }
        });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
    }
}
