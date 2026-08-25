import { NextRequest, NextResponse } from 'next/server';
import { 
    getWeeklyOverview, 
    saveClient, 
    getAllClients, 
    upsertBookingSession, 
    getSessionsForWeek,
    getActiveWeeklyMenu,
    getRecipeVault,
    deleteClient
} from '@/lib/cookingOpsStore';
import { createGoogleCalendarEvent } from '@/lib/googleCalendar';
import { getWeekBounds } from '@/lib/dateUtils';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const offsetParam = searchParams.get('offset');
        const offsetWeeks = offsetParam ? parseInt(offsetParam, 10) : 0;

        const { daysWithDates, weekLabel } = getWeekBounds(offsetWeeks);
        const startIso = daysWithDates[0].isoDate;
        const endIso = daysWithDates[daysWithDates.length - 1].isoDate;

        const weekMenu = await getActiveWeeklyMenu();
        const slotStatuses = getSessionsForWeek(startIso, endIso);
        const clients = getAllClients();
        const vaultRecipes = getRecipeVault();

        return NextResponse.json({
            weekMenu,
            weekLabel,
            startIso,
            endIso,
            slotStatuses,
            clients,
            vaultRecipes
        });
    } catch (error) {
        console.error('Error fetching admin cooking overview:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        if (!body.name) {
            return NextResponse.json({ error: 'Le nom du client est requis' }, { status: 400 });
        }

        const savedClient = saveClient({
            id: body.id,
            name: body.name,
            phone: body.phone || '',
            email: body.email || '',
            address: body.address || '',
            allergies: Array.isArray(body.allergies) ? body.allergies : [],
            dislikes: body.dislikes || '',
            defaultDishCount: Number(body.defaultDishCount) || 4,
            personCount: Number(body.personCount) || 2,
            notes: body.notes || ''
        });

        let gcalEventId = body.gcalEventId;

        // If booking a specific date & slot (Two-Way Sync to Google Calendar!)
        if (body.bookingDateIso && body.timeSlot) {
            if (!gcalEventId) {
                const createdGcalId = await createGoogleCalendarEvent({
                    clientName: savedClient.name,
                    dateIso: body.bookingDateIso,
                    timeSlot: body.timeSlot,
                    dishCount: savedClient.defaultDishCount,
                    personCount: savedClient.personCount,
                    notes: savedClient.notes
                });
                if (createdGcalId) {
                    gcalEventId = createdGcalId;
                }
            }

            upsertBookingSession({
                clientId: savedClient.id,
                clientName: savedClient.name,
                dateIso: body.bookingDateIso,
                dayName: body.dayName || 'Lundi',
                timeSlot: body.timeSlot,
                dishCount: savedClient.defaultDishCount,
                personCount: savedClient.personCount,
                gcalEventId,
                notes: body.notes
            });
        }

        return NextResponse.json({
            success: true,
            client: savedClient,
            gcalEventId
        });
    } catch (error) {
        console.error('Error saving client in admin:', error);
        return NextResponse.json({ error: 'Erreur lors de l’enregistrement du client' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get('id');
        if (!clientId) {
            return NextResponse.json({ error: 'ID requis' }, { status: 400 });
        }
        deleteClient(clientId);
        return NextResponse.json({ success: true, clients: getAllClients() });
    } catch (error) {
        console.error('Error deleting client:', error);
        return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 });
    }
}
