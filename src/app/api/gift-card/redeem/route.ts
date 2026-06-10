import { NextResponse } from 'next/server';
import { getGiftCard, redeemGiftCard } from '@/lib/googleSheets';

export async function POST(request: Request) {
    try {
        const { code } = await request.json();

        if (!code || typeof code !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Code invalide.' },
                { status: 400 }
            );
        }

        const giftCard = await getGiftCard(code);

        if (!giftCard) {
            return NextResponse.json(
                { success: false, error: 'Code cadeau inexistant.' },
                { status: 404 }
            );
        }

        if (giftCard.status !== 'Active') {
            return NextResponse.json(
                { success: false, error: `Ce bon cadeau ne peut pas être utilisé (statut: ${giftCard.status}).` },
                { status: 400 }
            );
        }

        const success = await redeemGiftCard(code);

        if (!success) {
            return NextResponse.json(
                { success: false, error: 'Échec lors de la mise à jour du bon cadeau.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Bon cadeau utilisé avec succès.'
        });
    } catch (error) {
        console.error('[API Gift Card Redeem Error]:', error);
        return NextResponse.json(
            { success: false, error: 'Erreur serveur lors de la validation du bon.' },
            { status: 500 }
        );
    }
}
