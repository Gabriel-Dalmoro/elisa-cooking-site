import { NextRequest, NextResponse } from 'next/server';
import { toggleClientBookedWeek, saveClient, getAllClients } from '@/lib/cookingOpsStore';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { clientId, isBooked, bookingDay, clientName, clientPhone, clientEmail } = body;

        // If client doesn't exist yet (e.g. from n8n booking automation), create or update them
        if (!clientId && clientName) {
            const newClient = saveClient({
                name: clientName,
                phone: clientPhone || '',
                email: clientEmail || '',
                isBookedThisWeek: true,
                bookingDay: bookingDay || 'Cette semaine'
            });
            return NextResponse.json({ success: true, client: newClient });
        }

        if (clientId) {
            const updated = toggleClientBookedWeek(clientId, Boolean(isBooked), bookingDay);
            return NextResponse.json({ success: true, client: updated });
        }

        return NextResponse.json({ error: 'Données de réservation invalides' }, { status: 400 });
    } catch (e) {
        console.error('Error updating client booking status:', e);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
