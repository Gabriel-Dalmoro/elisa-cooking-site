import { NextRequest, NextResponse } from 'next/server';
import { getClientByToken, updateClient } from '@/lib/db/clients';
import { findPastSeasonDish, getClientFacingMenu, listPastSeasonDishes } from '@/lib/db/menus';
import { getSelection, setRecipeOverride, upsertSelection, CUSTOM_DISH_RECIPE_ID } from '@/lib/db/selections';
import { sendSelectionEmail } from '@/lib/selectionEmail';
import { ClientProfile, WeeklyDish } from '@/lib/types/cooking-ops';
import { getStaffMember } from '@/lib/db/staff';
import { effectiveRecipe } from '@/lib/grocery/recipe';
import { getWeekBoundsForStart, getWeekOffsetForDate, isMondayIso, seasonOf, SEASON_OF_PHRASE, SEASON_PHRASE } from '@/lib/dateUtils';

/**
 * PUBLIC endpoint behind the client's personal link (/choisir/[token]).
 * Only returns what the client needs to pick dishes: never phone, email, address, access code,
 * notes, or Elisa's recipe instructions.
 */
async function toPublicClient(client: ClientProfile) {
    // Who the client deals with: their chef's first name, or Elisa
    let cook = 'Elisa';
    if (client.chefId) {
        const chef = await getStaffMember(client.chefId).catch(() => null);
        if (chef?.active && chef.displayName) cook = chef.displayName.split(/\s+/)[0];
    }
    return {
        firstName: client.name.split(/\s+/)[0],
        defaultDishCount: client.defaultDishCount,
        allergies: client.allergies,
        dislikes: client.dislikes || '',
        cook
    };
}

function toPublicDish(dish: WeeklyDish) {
    return { id: dish.id, name: dish.name, category: dish.category, description: dish.description || '' };
}

// "Cette semaine" / "Semaine prochaine": shown next to the dates so the client can't mix up two open weeks
function relativeWeek(weekStart: string): string {
    const offset = getWeekOffsetForDate(weekStart);
    if (offset <= 0) return 'Cette semaine';
    if (offset === 1) return 'Semaine prochaine';
    return `Dans ${offset} semaines`;
}

const NOT_FOUND = { error: 'Ce lien n’est pas valide. Contactez Elisa.' };
const CLOSED = { error: 'Les choix pour cette semaine sont clôturés. Contactez Elisa.' };
const ALREADY_SUBMITTED = { error: 'Vous avez déjà envoyé vos choix pour cette semaine. Pour toute modification, contactez Elisa.', alreadySubmitted: true };

export async function GET(req: NextRequest) {
    try {
        const token = new URL(req.url).searchParams.get('token') || '';
        const client = await getClientByToken(token);
        if (!client) {
            return NextResponse.json(NOT_FOUND, { status: 404 });
        }

        const facing = await getClientFacingMenu();
        if (facing.state !== 'open') {
            return NextResponse.json({
                client: await toPublicClient(client),
                state: facing.state,
                weekLabel: facing.state === 'closed' ? facing.menu.weekLabel : null
            });
        }

        // Every open week, with what the client already sent for it (if anything)
        const weeks = await Promise.all(facing.menus.map(async menu => {
            const [existing, past] = await Promise.all([
                getSelection(client.id, menu.weekStart),
                listPastSeasonDishes(menu.weekStart)
            ]);
            // Earlier dishes of the season the client can ask for again (not the ones already on this menu)
            const onThisMenu = new Set(menu.recipes.map(d => d.name.trim().toLowerCase()));
            const pastDishes = past
                .filter(p => !onThisMenu.has(p.dish.name.trim().toLowerCase()))
                .map(p => ({
                    ...toPublicDish(p.dish),
                    weekStart: p.weekStart,
                    cookedWeek: getWeekBoundsForStart(p.weekStart).weekLabel
                }));
            const season = seasonOf(menu.weekStart);
            return {
                weekStart: menu.weekStart,
                weekLabel: menu.weekLabel,
                when: relativeWeek(menu.weekStart),
                dishes: menu.recipes.map(toPublicDish),
                pastDishes,
                seasonPhrase: SEASON_PHRASE[season], // « cet automne »
                seasonOfPhrase: SEASON_OF_PHRASE[season], // « de l'automne »
                existingSelection: existing
                    ? {
                        selectedDishIds: existing.selectedDishIds,
                        // Names as shown to the client (snapshot kept if a dish was later removed from the menu)
                        selectedDishNames: existing.selectedDishIds.map((id, i) =>
                            menu.recipes.find(d => d.id === id)?.name || existing.selectedDishNames[i] || ''
                        ),
                        dishNotes: existing.dishNotes,
                        customDish: existing.customDish || '',
                        generalNote: existing.generalNote,
                        submittedAt: existing.submittedAt
                    }
                    : null
            };
        }));
        return NextResponse.json({ client: await toPublicClient(client), state: 'open', weeks });
    } catch (error) {
        console.error('Error fetching client cooking data:', error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token, weekStart, selectedDishIds, dishNotes, customDish, pastDish, generalNote, updatedAllergies, updatedDislikes } = body;

        if (typeof token !== 'string' || typeof weekStart !== 'string' || !Array.isArray(selectedDishIds)) {
            return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
        }

        const client = await getClientByToken(token);
        if (!client) {
            return NextResponse.json(NOT_FOUND, { status: 404 });
        }

        // The week the client was choosing for must still be open
        const facing = await getClientFacingMenu();
        const menu = facing.state === 'open' ? facing.menus.find(m => m.weekStart === weekStart) : undefined;
        if (!menu) {
            return NextResponse.json(CLOSED, { status: 409 });
        }

        // Choices are final once sent: changes go through Elisa
        const existing = await getSelection(client.id, weekStart);
        if (existing) {
            return NextResponse.json(ALREADY_SUBMITTED, { status: 409 });
        }

        // Exactly the formula: either all dishes from the menu, or all but one plus ONE custom dish
        const menuIds = new Set(menu.recipes.map(d => d.id));
        const ids = Array.from(new Set(selectedDishIds.filter((d: unknown): d is string => typeof d === 'string' && menuIds.has(d))));
        // A dish from an earlier menu of the season: checked here, and its recipe comes with it
        const picked = pastDish && typeof pastDish === 'object'
            && typeof pastDish.weekStart === 'string' && isMondayIso(pastDish.weekStart)
            && typeof pastDish.dishId === 'string'
            ? await findPastSeasonDish(weekStart, pastDish.weekStart, pastDish.dishId)
            : null;
        const custom = picked
            ? picked.name.slice(0, 500)
            : typeof customDish === 'string' ? customDish.trim().slice(0, 500) : '';
        const targetCount = Math.min(client.defaultDishCount, menu.recipes.length);
        const expectedFromMenu = custom ? targetCount - 1 : targetCount;
        if (ids.length !== expectedFromMenu || ids.length + (custom ? 1 : 0) === 0) {
            return NextResponse.json({
                error: custom
                    ? `Avec un plat sur mesure, choisissez ${expectedFromMenu} plat(s) du menu.`
                    : `Choisissez ${targetCount} plats (ou ${targetCount - 1} + un plat sur mesure).`
            }, { status: 400 });
        }

        const cleanNotes: Record<string, string> = {};
        if (dishNotes && typeof dishNotes === 'object') {
            for (const id of ids) {
                const note = (dishNotes as Record<string, unknown>)[id];
                if (typeof note === 'string' && note.trim()) cleanNotes[id] = note.trim().slice(0, 500);
            }
        }

        // Allergies can only be ADDED from the client link, never removed (health safety).
        // Removing an allergy has to go through Elisa.
        const requestedAllergies: string[] = Array.isArray(updatedAllergies)
            ? updatedAllergies.filter((a: unknown): a is string => typeof a === 'string' && a.trim().length > 0).map((a: string) => a.trim().slice(0, 100))
            : [];
        const addedAllergies = requestedAllergies.filter(a => !client.allergies.includes(a));
        const allergies = [...client.allergies, ...addedAllergies];

        const dislikesChanged = typeof updatedDislikes === 'string' && updatedDislikes.trim() !== (client.dislikes || '').trim();
        if (addedAllergies.length > 0 || dislikesChanged) {
            await updateClient(client.id, {
                ...(addedAllergies.length > 0 ? { allergies } : {}),
                ...(dislikesChanged ? { dislikes: String(updatedDislikes).slice(0, 500) } : {})
            });
        }

        let selection = await upsertSelection({
            clientId: client.id,
            weekStart,
            selectedDishIds: ids,
            selectedDishNames: ids.map(id => menu.recipes.find(d => d.id === id)?.name || ''),
            dishNotes: cleanNotes,
            customDish: custom,
            customDishFrom: picked ? pastDish.weekStart : undefined,
            generalNote: typeof generalNote === 'string' ? generalNote.trim().slice(0, 2000) : '',
            allergiesAtSubmission: allergies,
            allergiesAdded: addedAllergies
        });

        // Picked from an earlier menu: Elisa's recipe for it is copied onto this client's custom dish,
        // so the kitchen sheet and the grocery list are ready without retyping anything
        if (picked) {
            // Same split as the « Séparer » button: older recipes keep their ingredients inside the text
            const split = effectiveRecipe(picked.ingredients || '', (picked.instructions || []).join('\n'));
            const steps = split.steps.trim();
            const ingredients = split.ingredients.trim();
            if (steps || ingredients) {
                try {
                    selection = await setRecipeOverride(client.id, weekStart, CUSTOM_DISH_RECIPE_ID, steps, ingredients);
                } catch (e) {
                    // The choice is saved; only the recipe copy failed (Elisa can still add it by hand)
                    console.error('Copying the past recipe failed:', e);
                }
            }
        }

        // Tell Elisa (never blocks or fails the client's submission)
        await sendSelectionEmail({
            client: { ...client, allergies, ...(dislikesChanged ? { dislikes: String(updatedDislikes).slice(0, 500) } : {}) },
            selection,
            menu,
            baseUrl: req.nextUrl.origin
        });

        return NextResponse.json({ success: true, message: 'Vos choix ont été enregistrés avec succès !' });
    } catch (error) {
        console.error('Error saving client selection:', error);
        return NextResponse.json({ error: 'Erreur lors de l’enregistrement' }, { status: 500 });
    }
}
