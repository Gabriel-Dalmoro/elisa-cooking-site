import { NextRequest, NextResponse } from 'next/server';
import { requireOwner, requireStaff } from '@/lib/auth';
import { isOwner } from '@/lib/access';
import { listClients } from '@/lib/db/clients';
import { listSessionPriceOverrides, listSessions, getSession, setSessionPriceOverride } from '@/lib/db/sessions';
import { getStaffMember, listStaff } from '@/lib/db/staff';
import { getParisDateTimeInfo } from '@/lib/dateUtils';
import { chefSessionPay, clientPriceCents, elisaSessionKeeps, phaseFor } from '@/lib/remuneration';

/**
 * What each session of a month pays (amounts in cents).
 * GET ?month=YYYY-MM&who=<chef id | elisa>
 *   Elisa: any chef's sessions with the client price and both shares, or her own sessions (who=elisa).
 *   A chef: only their own sessions and only their own amounts: no client price while Elisa bills
 *   the client (phase 1), no plans, no hand-set prices.
 * PATCH { sessionId, priceOverride: euros | null } → Elisa sets one session's price (null = usual price)
 */

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

function monthBounds(month: string) {
    const [y, m] = month.split('-').map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return { startIso: `${month}-01`, endIso: `${month}-${String(lastDay).padStart(2, '0')}` };
}

const errorResponse = (error: unknown) =>
    NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });

export async function GET(req: NextRequest) {
    const { staff, denied } = await requireStaff();
    if (denied) return denied;

    try {
        const params = new URL(req.url).searchParams;
        const todayIso = getParisDateTimeInfo(new Date()).isoDate;
        const month = MONTH.test(params.get('month') || '') ? params.get('month')! : todayIso.slice(0, 7);
        const { startIso, endIso } = monthBounds(month);
        const owner = isOwner(staff);

        // Who we are looking at: a chef only ever sees themselves
        const team = owner ? (await listStaff()).filter(s => s.role === 'chef') : [];
        let who = owner ? params.get('who') || '' : staff.userId;
        if (owner && who !== 'elisa' && !team.some(c => c.userId === who)) {
            who = team.find(c => c.active)?.userId || 'elisa';
        }
        const chef = who === 'elisa' ? null : owner ? team.find(c => c.userId === who) || null : await getStaffMember(who);
        if (who !== 'elisa' && !chef) return NextResponse.json({ error: 'Chef introuvable' }, { status: 404 });

        const [sessions, clients, overrides] = await Promise.all([
            listSessions(startIso, endIso, chef ? chef.userId : undefined),
            listClients(),
            listSessionPriceOverrides(startIso, endIso)
        ]);
        const clientsById = new Map(clients.map(c => [c.id, c]));
        const mine = chef ? sessions : sessions.filter(s => !s.assignedTo);

        const rows = mine.map(s => {
            const client = clientsById.get(s.clientId);
            const plan = client?.billingPlan || 'abonnement';
            const priceOverride = overrides[s.id] ?? null;
            const clientPrice = clientPriceCents({
                dishCount: s.dishCount,
                personCount: s.personCount,
                plan,
                customPrice: client?.customPrice,
                priceOverride
            });
            const base = {
                id: s.id,
                dateIso: s.dateIso,
                dayName: s.dayName,
                timeSlot: s.timeSlot,
                clientName: client?.name || s.clientName,
                dishCount: s.dishCount,
                personCount: s.personCount,
                done: s.dateIso <= todayIso
            };

            if (!chef) {
                return { ...base, plan, priceOverride, clientPrice, elisaKeeps: clientPrice == null ? null : elisaSessionKeeps(clientPrice) };
            }
            const phase = phaseFor(s.dateIso, chef.sapActiveSince, plan);
            const pay = clientPrice == null ? null : chefSessionPay(clientPrice, chef.urssafRate);
            if (owner) return { ...base, plan, priceOverride, clientPrice, phase, pay };
            // The chef's own view
            return {
                ...base,
                phase,
                priced: Boolean(pay),
                chefInvoice: pay ? pay.phase1.chefInvoice : null,
                keepsNow: pay ? pay.phase1.chefKeeps : null,
                keepsBoosted: pay ? pay.phase2.chefKeeps : null,
                boost: pay ? pay.boost : null,
                // In phase 2 the chef bills the client and pays Elisa's fee: they need both amounts
                ...(phase === 2 && pay ? { clientPrice, elisaFee: pay.phase2.elisaFee } : {})
            };
        });

        return NextResponse.json({
            month,
            todayIso,
            who,
            people: owner
                ? [...team.map(c => ({ id: c.userId, name: c.displayName || c.email, active: c.active })), { id: 'elisa', name: 'Elisa' }]
                : [],
            chef: chef ? { userId: chef.userId, name: chef.displayName || chef.email, sapActiveSince: chef.sapActiveSince, urssafRate: chef.urssafRate } : null,
            rows
        });
    } catch (error) {
        console.error('[remuneration] GET failed:', error);
        return errorResponse(error);
    }
}

export async function PATCH(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;
    try {
        const body = await req.json();
        const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
        if (!sessionId || sessionId.length > 80) {
            return NextResponse.json({ error: 'Séance manquante' }, { status: 400 });
        }
        let price: number | null = null;
        if (body.priceOverride !== null && body.priceOverride !== '') {
            price = Number(body.priceOverride);
            if (!Number.isFinite(price) || price <= 0 || price > 10000) {
                return NextResponse.json({ error: 'Prix invalide' }, { status: 400 });
            }
            price = Math.round(price * 100) / 100;
        }
        if (!(await getSession(sessionId))) return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 });
        await setSessionPriceOverride(sessionId, price);
        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error);
    }
}
