import { NextRequest, NextResponse } from 'next/server';
import { saveClient, getAllClients } from '@/lib/cookingOpsStore';
import { ClientProfile } from '@/lib/types/cooking-ops';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const rawClients = body.clients;

        if (!Array.isArray(rawClients) || rawClients.length === 0) {
            return NextResponse.json({ error: 'Aucun client valide trouvé dans le fichier CSV' }, { status: 400 });
        }

        let importedCount = 0;
        const savedClients: ClientProfile[] = [];

        for (const item of rawClients) {
            if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
                continue;
            }

            const allergies = Array.isArray(item.allergies) 
                ? item.allergies 
                : typeof item.allergies === 'string' && item.allergies.trim().length > 0
                    ? item.allergies.split(/[,;\/|]+/).map((a: string) => a.trim()).filter((a: string) => a.length > 0)
                    : [];

            const saved = saveClient({
                name: item.name.trim(),
                phone: item.phone ? String(item.phone).trim() : '',
                email: item.email ? String(item.email).trim() : '',
                address: item.address ? String(item.address).trim() : '',
                defaultDishCount: Number(item.defaultDishCount) || Number(item.dishCount) || 4,
                personCount: Number(item.personCount) || 2,
                allergies,
                dislikes: item.dislikes ? String(item.dislikes).trim() : '',
                notes: item.notes ? String(item.notes).trim() : ''
            });

            savedClients.push(saved);
            importedCount++;
        }

        return NextResponse.json({
            success: true,
            importedCount,
            totalClients: getAllClients().length,
            clients: getAllClients()
        });
    } catch (error) {
        console.error('Error importing clients CSV:', error);
        return NextResponse.json({ error: 'Erreur lors de l’importation des clients' }, { status: 500 });
    }
}
