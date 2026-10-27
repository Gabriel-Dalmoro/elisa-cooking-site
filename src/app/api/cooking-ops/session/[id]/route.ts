import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSessionIgnored, deleteSession, rescheduleAppSession, setSessionAssignee, listClientSessionsInSlot } from '@/lib/db/sessions';
import { getStaffMember } from '@/lib/db/staff';
import { deleteGoogleCalendarEvent } from '@/lib/googleCalendar';
import { getClientById } from '@/lib/db/clients';
import { getSelection, setRecipeOverride, setTitleOverride, setGroceryState, CUSTOM_DISH_RECIPE_ID } from '@/lib/db/selections';
import { getMenu } from '@/lib/db/menus';
import { getWeekStartForDate } from '@/lib/dateUtils';
import { requireStaff } from '@/lib/auth';
import { canAccessSession, clientForStaff, forbidden, isOwner } from '@/lib/access';

type Params = { params: Promise<{ id: string }> };

/**
 * Kitchen sheet for one session: client, allergies, access code, and the dishes the client chose
 * (with Elisa's instructions from that week's menu).
 */
export async function GET(_req: NextRequest, { params }: Params) {
    const { staff, denied } = await requireStaff();
    if (denied) return denied;

    try {
        const { id } = await params;
        const session = await getSession(id);
        if (!session) {
            return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 });
        }
        // A chef only opens the sessions assigned to them
        if (!canAccessSession(staff, session)) return forbidden('Cette séance ne vous est pas attribuée');

        const weekStart = getWeekStartForDate(session.dateIso);
        const [client, menu] = await Promise.all([
            session.clientId ? getClientById(session.clientId) : Promise.resolve(null),
            getMenu(weekStart)
        ]);
        const selection = client ? await getSelection(client.id, weekStart) : null;

        // Dishes chosen by the client, in menu order. A chosen dish later removed from the menu
        // is still listed by name so nothing silently disappears from the kitchen sheet.
        const chosenIds = selection?.selectedDishIds || [];
        const dishes = menu.recipes.filter(d => chosenIds.includes(d.id));
        const missingDishNames = chosenIds
            .map((dishId, i) => (menu.recipes.some(d => d.id === dishId) ? null : selection?.selectedDishNames[i] || null))
            .filter((n): n is string => Boolean(n));

        return NextResponse.json({
            session,
            client: client ? clientForStaff(staff, client) : null,
            selection,
            dishes,
            missingDishNames,
            weekLabel: menu.weekLabel
        });
    } catch (error) {
        console.error('Error loading session:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
    }
}

/**
 * PATCH { ignored: boolean } → hide a calendar event that isn't a cooking session (kept hidden across syncs)
 * PATCH { dishId, title } → the dish's title for THIS client's week only (empty = back to the menu's)
 * PATCH { dishId, recipe, ingredients? } → Elisa's recipe for one dish, adapted for THIS client only
 *   (the week's menu and the recipe bank stay unchanged; both empty goes back to the menu one)
 * PATCH { groceryChecked?, groceryEdits?: { itemKey: amount }, groceryExtras?: string[] } → saves this client's grocery list
 *   for the week (ticked items, quantities corrected by hand; an empty amount goes back to the calculated one)
 * PATCH { dateIso, timeSlot } → moves a session created in the app (Google ones move in Google Calendar)
 * PATCH { assignedTo: chefId | null } → who cooks it (Elisa only; null = Elisa)
 * PATCH { mergeDuplicates: true } → the same client booked twice on this day and slot becomes one session
 *   (Elisa only): the Google Calendar one is kept, cooked by the chef of the other copy, the copy is removed
 * A chef can do all of this on their own sessions, except hiding events and reassigning.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
    const { staff, denied } = await requireStaff();
    if (denied) return denied;

    try {
        const { id } = await params;
        const body = await req.json();
        const current = await getSession(id);
        if (!current) return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 });
        if (!canAccessSession(staff, current)) return forbidden('Cette séance ne vous est pas attribuée');

        if (body.mergeDuplicates === true) {
            if (!isOwner(staff)) return forbidden('Seule Elisa peut fusionner des séances');
            if (!current.clientId) return NextResponse.json({ error: 'Aucune fiche client liée à cette séance' }, { status: 400 });
            const copies = await listClientSessionsInSlot(current.clientId, current.dateIso, current.timeSlot);
            if (copies.length < 2) return NextResponse.json({ success: true, session: current });
            const fromGoogle = copies.filter(s => s.gcalEventId);
            if (fromGoogle.length > 1) {
                return NextResponse.json(
                    { error: 'Ce client a deux événements dans votre Google Calendar ce jour-là : supprimez-en un dans votre agenda.' },
                    { status: 409 }
                );
            }
            // Google Calendar stays the reference; otherwise the oldest copy is kept
            const keep = fromGoogle[0] || copies[0];
            const cook = copies.find(s => s.assignedTo)?.assignedTo ?? null;
            for (const copy of copies) {
                if (copy.id === keep.id) continue;
                // A week of a series is kept as cancelled so it isn't planned again
                if (copy.seriesId) await setSessionIgnored(copy.id, true);
                else await deleteSession(copy.id);
            }
            const session = cook !== keep.assignedTo ? await setSessionAssignee(keep.id, cook) : keep;
            return NextResponse.json({ success: true, session });
        }

        if ('assignedTo' in body) {
            if (!isOwner(staff)) return forbidden('Seule Elisa attribue les séances');
            const chefId = typeof body.assignedTo === 'string' && body.assignedTo ? body.assignedTo : null;
            if (chefId) {
                const chef = await getStaffMember(chefId).catch(() => null);
                if (!chef || chef.role !== 'chef' || !chef.active) {
                    return NextResponse.json({ error: 'Chef introuvable ou désactivé' }, { status: 400 });
                }
            }
            const session = await setSessionAssignee(id, chefId);
            return NextResponse.json({ success: true, session });
        }

        if (typeof body.dateIso === 'string' && typeof body.timeSlot === 'string') {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(body.dateIso) || !['Matin', 'Après-midi'].includes(body.timeSlot)) {
                return NextResponse.json({ error: 'Créneau invalide' }, { status: 400 });
            }
            const session = await rescheduleAppSession(id, body.dateIso, body.timeSlot);
            return NextResponse.json({ success: true, session });
        }

        if (typeof body.dishId === 'string' && typeof body.title === 'string') {
            if (!current.clientId) return NextResponse.json({ error: 'Aucune fiche client liée à cette séance' }, { status: 404 });
            const weekStart = getWeekStartForDate(current.dateIso);
            const selection = await getSelection(current.clientId, weekStart);
            const isChosen = body.dishId === CUSTOM_DISH_RECIPE_ID
                ? Boolean(selection?.customDish)
                : Boolean(selection?.selectedDishIds.includes(body.dishId));
            if (!isChosen) return NextResponse.json({ error: 'Ce plat ne fait pas partie des choix du client' }, { status: 400 });
            const updated = await setTitleOverride(current.clientId, weekStart, body.dishId, body.title.slice(0, 120));
            return NextResponse.json({ success: true, selection: updated });
        }

        if (typeof body.dishId === 'string' && typeof body.recipe === 'string') {
            const session = await getSession(id);
            if (!session?.clientId) {
                return NextResponse.json({ error: 'Aucune fiche client liée à cette séance' }, { status: 404 });
            }
            const weekStart = getWeekStartForDate(session.dateIso);
            const selection = await getSelection(session.clientId, weekStart);
            const isChosen = body.dishId === CUSTOM_DISH_RECIPE_ID
                ? Boolean(selection?.customDish)
                : Boolean(selection?.selectedDishIds.includes(body.dishId));
            if (!isChosen) {
                return NextResponse.json({ error: 'Ce plat ne fait pas partie des choix du client' }, { status: 400 });
            }
            const ingredients = typeof body.ingredients === 'string' ? body.ingredients.slice(0, 20000) : undefined;
            const updated = await setRecipeOverride(session.clientId, weekStart, body.dishId, body.recipe.slice(0, 20000), ingredients);
            return NextResponse.json({ success: true, selection: updated });
        }

        const hasEdits = body.groceryEdits && typeof body.groceryEdits === 'object' && !Array.isArray(body.groceryEdits);
        if (Array.isArray(body.groceryChecked) || hasEdits || Array.isArray(body.groceryExtras)) {
            const session = await getSession(id);
            if (!session?.clientId) {
                return NextResponse.json({ error: 'Aucune fiche client liée à cette séance' }, { status: 404 });
            }
            const checked = Array.isArray(body.groceryChecked)
                ? body.groceryChecked
                    .filter((k: unknown): k is string => typeof k === 'string' && k.length > 0)
                    .slice(0, 1000)
                    .map((k: string) => k.slice(0, 200))
                : undefined;
            let edits: Record<string, string> | undefined;
            if (hasEdits) {
                edits = {};
                for (const [key, value] of Object.entries(body.groceryEdits as Record<string, unknown>).slice(0, 500)) {
                    if (typeof value === 'string' && value.trim() && key) edits[key.slice(0, 200)] = value.trim().slice(0, 60);
                }
            }
            const extras = Array.isArray(body.groceryExtras)
                ? body.groceryExtras
                    .filter((l: unknown): l is string => typeof l === 'string' && l.trim().length > 0)
                    .slice(0, 100)
                    .map((l: string) => l.trim().slice(0, 100))
                : undefined;
            const updated = await setGroceryState(session.clientId, getWeekStartForDate(session.dateIso), { checked, edits, extras });
            return NextResponse.json({ success: true, selection: updated });
        }

        const { ignored } = body;
        if (!isOwner(staff)) return forbidden('Seule Elisa peut masquer un événement');
        if (typeof ignored !== 'boolean') {
            return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
        }
        await setSessionIgnored(id, ignored);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating session:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
    }
}

/**
 * DELETE → cancels the booking: removes the Google Calendar event first (if it has one)
 * (Google is the source of truth), then the stored session.
 * If Google refuses, nothing is deleted, so the two never drift apart.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
    const { staff, denied } = await requireStaff();
    if (denied) return denied;

    try {
        const { id } = await params;
        const session = await getSession(id);
        if (!session) {
            return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 });
        }
        // A chef cancels their own app sessions; a session from Elisa's Google Calendar stays hers to cancel
        if (!isOwner(staff)) {
            if (!canAccessSession(staff, session)) return forbidden('Cette séance ne vous est pas attribuée');
            if (session.gcalEventId) return forbidden('Cette séance vient de l’agenda d’Elisa : demandez-lui de l’annuler.');
        }

        // A week of a recurring series: kept as cancelled so it isn't planned again
        if (session.seriesId) {
            await setSessionIgnored(id, true);
            return NextResponse.json({ success: true });
        }

        if (session.gcalEventId) {
            const gcalRes = await deleteGoogleCalendarEvent(session.gcalEventId);
            if (!gcalRes.success) {
                return NextResponse.json(
                    { error: `Google Calendar a refusé la suppression : ${gcalRes.error}. La séance n'a pas été supprimée.` },
                    { status: 502 }
                );
            }
        }

        await deleteSession(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting session:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
    }
}
