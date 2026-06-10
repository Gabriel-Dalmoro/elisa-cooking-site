import { NextResponse } from 'next/server';
import { getGiftCard } from '@/lib/googleSheets';

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

        if (giftCard.status === 'Redeemed') {
            return NextResponse.json(
                { success: false, error: 'Ce bon cadeau a déjà été utilisé.' },
                { status: 400 }
            );
        }

        if (giftCard.status === 'Expired') {
            return NextResponse.json(
                { success: false, error: 'Ce bon cadeau a expiré.' },
                { status: 400 }
            );
        }

        if (giftCard.status !== 'Active') {
            return NextResponse.json(
                { success: false, error: 'Ce bon cadeau n’est pas actif.' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            giftCard: {
                code: giftCard.code,
                packageType: giftCard.packageType,
                giver: giftCard.giver,
                recipient: giftCard.recipient,
                expiryDate: giftCard.expiryDate,
                recipes: giftCard.recipes,
                people: giftCard.people,
            }
        });
    } catch (error) {
        console.error('[API Gift Card Validate Error]:', error);
        return NextResponse.json(
            { success: false, error: 'Erreur serveur lors de la validation.' },
            { status: 500 }
        );
    }
}
