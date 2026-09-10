import { NextRequest, NextResponse } from 'next/server';
import { getActiveWeeklyMenu, getClientSelection, saveClientSelection } from '@/lib/cookingOpsStore';
import { getClientByToken, updateClient } from '@/lib/db/clients';
import { ClientProfile } from '@/lib/types/cooking-ops';

/**
 * PUBLIC endpoint behind the client's personal link (/choisir/[token]).
 * Only returns what the client needs to pick dishes: never phone, email, address, access code or notes.
 */
function toPublicClient(client: ClientProfile) {
    return {
        firstName: client.name.split(/\s+/)[0],
        defaultDishCount: client.defaultDishCount,
        allergies: client.allergies,
        dislikes: client.dislikes || ''
    };
}

const NOT_FOUND = { error: 'Ce lien n’est pas valide. Contactez Elisa sur WhatsApp.' };

export async function GET(req: NextRequest) {
    try {
        const token = new URL(req.url).searchParams.get('token') || '';
        const client = await getClientByToken(token);
        if (!client) {
            return NextResponse.json(NOT_FOUND, { status: 404 });
        }

        const menu = await getActiveWeeklyMenu();
        const existingSelection = getClientSelection(client.id, menu.weekLabel);

        return NextResponse.json({
            client: toPublicClient(client),
            menu,
            existingSelection
        });
    } catch (error) {
        console.error('Error fetching client cooking data:', error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token, selectedDishNames, dishNotes, generalNote, updatedAllergies, updatedDislikes } = body;

        if (typeof token !== 'string' || !Array.isArray(selectedDishNames)) {
            return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
        }

        const client = await getClientByToken(token);
        if (!client) {
            return NextResponse.json(NOT_FOUND, { status: 404 });
        }

        // Allergies can only be ADDED from the client link, never removed (health safety).
        // Removing an allergy has to go through Elisa.
        const requestedAllergies: string[] = Array.isArray(updatedAllergies)
            ? updatedAllergies.filter((a: unknown): a is string => typeof a === 'string' && a.trim().length > 0)
            : [];
        const addedAllergies = requestedAllergies.filter(a => !client.allergies.includes(a));
        const allergies = [...client.allergies, ...addedAllergies];

        const dislikesChanged = typeof updatedDislikes === 'string' && updatedDislikes.trim() !== (client.dislikes || '').trim();
        if (addedAllergies.length > 0 || dislikesChanged) {
            await updateClient(client.id, {
                ...(addedAllergies.length > 0 ? { allergies } : {}),
                ...(dislikesChanged ? { dislikes: updatedDislikes } : {})
            });
        }

        const menu = await getActiveWeeklyMenu();
        const selection = await saveClientSelection({
            clientId: client.id,
            weekLabel: menu.weekLabel,
            selectedDishNames: selectedDishNames.filter((d: unknown): d is string => typeof d === 'string'),
            dishNotes: dishNotes && typeof dishNotes === 'object' ? dishNotes : {},
            generalNote: typeof generalNote === 'string' ? generalNote : '',
            allergiesAtSubmission: allergies
        });

        return NextResponse.json({
            success: true,
            selection,
            message: 'Vos choix ont été enregistrés avec succès !'
        });
    } catch (error) {
        console.error('Error saving client selection:', error);
        return NextResponse.json({ error: 'Erreur lors de l’enregistrement' }, { status: 500 });
    }
}
