import { NextRequest, NextResponse } from 'next/server';
import { getClientByToken, updateClient } from '@/lib/db/clients';
import { getClientFacingMenu } from '@/lib/db/menus';
import { getSelection, upsertSelection } from '@/lib/db/selections';
import { ClientProfile, WeeklyDish } from '@/lib/types/cooking-ops';

/**
 * PUBLIC endpoint behind the client's personal link (/choisir/[token]).
 * Only returns what the client needs to pick dishes: never phone, email, address, access code,
 * notes, or Elisa's recipe instructions.
 */
function toPublicClient(client: ClientProfile) {
    return {
        firstName: client.name.split(/\s+/)[0],
        defaultDishCount: client.defaultDishCount,
        allergies: client.allergies,
        dislikes: client.dislikes || ''
    };
}

function toPublicDish(dish: WeeklyDish) {
    return { id: dish.id, name: dish.name, category: dish.category, description: dish.description || '' };
}

const NOT_FOUND = { error: 'Ce lien n’est pas valide. Contactez Elisa sur WhatsApp.' };
const CLOSED = { error: 'Les choix pour cette semaine sont clôturés. Contactez Elisa sur WhatsApp.' };

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
                client: toPublicClient(client),
                state: facing.state,
                weekLabel: facing.state === 'closed' ? facing.menu.weekLabel : null
            });
        }

        const existing = await getSelection(client.id, facing.menu.weekStart);
        return NextResponse.json({
            client: toPublicClient(client),
            state: 'open',
            menu: {
                weekStart: facing.menu.weekStart,
                weekLabel: facing.menu.weekLabel,
                dishes: facing.menu.recipes.map(toPublicDish)
            },
            existingSelection: existing
                ? {
                    selectedDishIds: existing.selectedDishIds,
                    dishNotes: existing.dishNotes,
                    generalNote: existing.generalNote,
                    submittedAt: existing.submittedAt
                }
                : null
        });
    } catch (error) {
        console.error('Error fetching client cooking data:', error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token, weekStart, selectedDishIds, dishNotes, generalNote, updatedAllergies, updatedDislikes } = body;

        if (typeof token !== 'string' || typeof weekStart !== 'string' || !Array.isArray(selectedDishIds)) {
            return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
        }

        const client = await getClientByToken(token);
        if (!client) {
            return NextResponse.json(NOT_FOUND, { status: 404 });
        }

        // The menu must still be open, and be the one the client was looking at
        const facing = await getClientFacingMenu();
        if (facing.state !== 'open' || facing.menu.weekStart !== weekStart) {
            return NextResponse.json(CLOSED, { status: 409 });
        }
        const menu = facing.menu;

        const menuIds = new Set(menu.recipes.map(d => d.id));
        const ids = Array.from(new Set(selectedDishIds.filter((d: unknown): d is string => typeof d === 'string' && menuIds.has(d))));
        const maxCount = Math.min(client.defaultDishCount, menu.recipes.length);
        if (ids.length === 0 || ids.length > maxCount) {
            return NextResponse.json({ error: `Choisissez jusqu’à ${maxCount} plats.` }, { status: 400 });
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

        // Keep earlier "added by the client" flags if the client re-submits
        const existing = await getSelection(client.id, weekStart);
        const allergiesAdded = Array.from(new Set([...(existing?.allergiesAdded || []), ...addedAllergies]));

        await upsertSelection({
            clientId: client.id,
            weekStart,
            selectedDishIds: ids,
            selectedDishNames: ids.map(id => menu.recipes.find(d => d.id === id)?.name || ''),
            dishNotes: cleanNotes,
            generalNote: typeof generalNote === 'string' ? generalNote.trim().slice(0, 2000) : '',
            allergiesAtSubmission: allergies,
            allergiesAdded
        });

        return NextResponse.json({ success: true, message: 'Vos choix ont été enregistrés avec succès !' });
    } catch (error) {
        console.error('Error saving client selection:', error);
        return NextResponse.json({ error: 'Erreur lors de l’enregistrement' }, { status: 500 });
    }
}
