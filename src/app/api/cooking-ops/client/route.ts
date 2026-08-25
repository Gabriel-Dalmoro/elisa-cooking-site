import { NextRequest, NextResponse } from 'next/server';
import { getClientByToken, getActiveWeeklyMenu, getClientSelection, saveClientSelection } from '@/lib/cookingOpsStore';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Token requis' }, { status: 400 });
        }

        const client = getClientByToken(token);
        if (!client) {
            return NextResponse.json({ error: 'Client introuvable avec ce lien' }, { status: 404 });
        }

        const menu = await getActiveWeeklyMenu();
        const existingSelection = getClientSelection(client.id, menu.weekLabel);

        return NextResponse.json({
            client,
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

        if (!token || !Array.isArray(selectedDishNames)) {
            return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
        }

        const client = getClientByToken(token);
        if (!client) {
            return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
        }

        const menu = await getActiveWeeklyMenu();

        const selection = saveClientSelection({
            clientId: client.id,
            weekLabel: menu.weekLabel,
            selectedDishNames,
            dishNotes,
            generalNote,
            updatedAllergies,
            updatedDislikes
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
