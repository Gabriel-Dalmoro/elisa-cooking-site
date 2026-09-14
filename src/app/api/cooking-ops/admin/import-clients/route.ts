import { NextRequest, NextResponse } from 'next/server';
import { listClients, createClient } from '@/lib/db/clients';
import { ClientProfile } from '@/lib/types/cooking-ops';
import { requireOwner } from '@/lib/auth';

const normalizeName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');

export async function POST(req: NextRequest) {
    const denied = await requireOwner();
    if (denied) return denied;

    try {
        const body = await req.json();
        const rawClients = body.clients;

        if (!Array.isArray(rawClients) || rawClients.length === 0) {
            return NextResponse.json({ error: 'Aucun client valide trouvé dans le fichier CSV' }, { status: 400 });
        }

        // Rows matching an existing client name are skipped, never merged into (and never overwrite) that client
        const existingNames = new Set((await listClients()).map(c => normalizeName(c.name)));
        const savedClients: ClientProfile[] = [];
        const skippedNames: string[] = [];

        for (const item of rawClients) {
            if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
                continue;
            }
            if (existingNames.has(normalizeName(item.name))) {
                skippedNames.push(item.name.trim());
                continue;
            }

            const allergies = Array.isArray(item.allergies)
                ? item.allergies
                : typeof item.allergies === 'string' && item.allergies.trim().length > 0
                    ? item.allergies.split(/[,;\/|]+/).map((a: string) => a.trim()).filter((a: string) => a.length > 0)
                    : [];

            const saved = await createClient({
                name: item.name.trim(),
                phone: item.phone ? String(item.phone) : '',
                email: item.email ? String(item.email) : '',
                address: item.address ? String(item.address) : '',
                accessCode: item.accessCode ? String(item.accessCode) : '',
                defaultDishCount: Number(item.defaultDishCount) || Number(item.dishCount) || 4,
                personCount: Number(item.personCount) || 2,
                allergies,
                dislikes: item.dislikes ? String(item.dislikes) : '',
                notes: item.notes ? String(item.notes) : '',
                privateNotes: item.privateNotes ? String(item.privateNotes) : ''
            });

            existingNames.add(normalizeName(saved.name));
            savedClients.push(saved);
        }

        return NextResponse.json({
            success: true,
            importedCount: savedClients.length,
            skippedNames,
            clients: await listClients()
        });
    } catch (error) {
        console.error('Error importing clients CSV:', error);
        const message = error instanceof Error ? error.message : 'Erreur lors de l’importation des clients';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
