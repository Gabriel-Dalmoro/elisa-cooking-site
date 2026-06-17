import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const PACKAGES = {
    discovery: {
        name: 'Pack Découverte (3 recettes / 4 personnes - 12 portions)',
        price: 150,
        groceryEstimate: 60,
        recipes: 3,
        people: 4,
    },
    special: {
        name: 'Pack Spécial (4 recettes / 4 personnes - 16 portions)',
        price: 190,
        groceryEstimate: 80,
        recipes: 4,
        people: 4,
    },
    family: {
        name: 'Pack Famille (5 recettes / 4 personnes - 20 portions)',
        price: 230,
        groceryEstimate: 100,
        recipes: 5,
        people: 4,
    },
    comfort: {
        name: 'Pack Confort (6 recettes / 4 personnes - 24 portions)',
        price: 270,
        groceryEstimate: 120,
        recipes: 6,
        people: 4,
    },
};

export async function POST(request: Request) {
    try {
        const { packageId, senderName, recipientName, message, deliveryEmail } = await request.json();

        // 1. Validation
        if (!packageId || !PACKAGES[packageId as keyof typeof PACKAGES]) {
            return NextResponse.json({ success: false, error: 'Formule invalide.' }, { status: 400 });
        }

        if (!senderName || !recipientName || !deliveryEmail) {
            return NextResponse.json({ success: false, error: 'Informations manquantes.' }, { status: 400 });
        }

        const selectedPack = PACKAGES[packageId as keyof typeof PACKAGES];
        const origin = request.headers.get('origin') || 'https://www.elisabatchcooking.com';

        const totalAmount = selectedPack.price;

        // 2. Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Bon Cadeau Elisa Batch Cooking - ${selectedPack.name}`,
                            description: `Offert à ${recipientName} de la part de ${senderName}. Hors coût des ingrédients (seul le coût des courses reste à la charge du bénéficiaire lors de la séance). Valable 6 mois.`,
                        },
                        unit_amount: totalAmount * 100, // in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${origin}/carte-cadeau/merci?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/carte-cadeau`,
            metadata: {
                packageId,
                senderName,
                recipientName,
                message: message || '',
                deliveryEmail,
                recipes: selectedPack.recipes.toString(),
                people: selectedPack.people.toString(),
                includeGroceries: 'false',
                groceriesAmount: '0',
            },
        });

        return NextResponse.json({ success: true, url: session.url });
    } catch (error: any) {
        console.error('[Stripe Checkout Session Error]:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Erreur lors de la création de la session de paiement.' },
            { status: 500 }
        );
    }
}
