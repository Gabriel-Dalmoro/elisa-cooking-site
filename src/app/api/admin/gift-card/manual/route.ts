import { NextResponse } from 'next/server';
import { createGiftCard } from '@/lib/googleSheets';

const PACKAGES = {
    discovery: {
        name: 'Pack Découverte (3 recettes / 4 personnes - 12 portions)',
        price: 150,
        recipes: 3,
        people: 4,
    },
    special: {
        name: 'Pack Spécial (4 recettes / 4 personnes - 16 portions)',
        price: 190,
        recipes: 4,
        people: 4,
    },
    family: {
        name: 'Pack Famille (5 recettes / 4 personnes - 20 portions)',
        price: 230,
        recipes: 5,
        people: 4,
    },
    comfort: {
        name: 'Pack Confort (6 recettes / 4 personnes - 24 portions)',
        price: 270,
        recipes: 6,
        people: 4,
    },
};

// Generate a random readable unique code: ECBC-XXXXX
function generateVoucherCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars (I, O, 0, 1)
    let code = 'ECBC-';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function POST(request: Request) {
    try {
        // 1. Password Verification
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== 'Bearer elisa2024') {
            return NextResponse.json({ success: false, error: 'Non autorisé.' }, { status: 401 });
        }

        const { packageId, senderName, recipientName, message, deliveryEmail, customRecipes, customPeople, startDate, customText } = await request.json();

        // 2. Validation
        if (!packageId) {
            return NextResponse.json({ success: false, error: 'Formule non spécifiée.' }, { status: 400 });
        }

        if (!senderName || !recipientName || !deliveryEmail) {
            return NextResponse.json({ success: false, error: 'Informations manquantes.' }, { status: 400 });
        }

        let selectedPackName = '';
        let totalAmount = 0;
        let recipesCount = 4;
        let peopleCount = 4;

        if (packageId === 'custom') {
            const recipes = parseInt(customRecipes);
            const people = parseInt(customPeople);

            if (![3, 5, 6].includes(recipes)) {
                return NextResponse.json({ success: false, error: 'Nombre de recettes invalide (doit être 3, 5 ou 6).' }, { status: 400 });
            }
            if (isNaN(people) || people < 2 || people > 6) {
                return NextResponse.json({ success: false, error: 'Nombre de personnes invalide (doit être entre 2 et 6).' }, { status: 400 });
            }

            const basePrices: Record<number, number> = { 3: 120, 5: 200, 6: 240 };
            totalAmount = basePrices[recipes] + (people - 1) * 10;
            recipesCount = recipes;
            peopleCount = people;
            selectedPackName = `Formule Sur-Mesure (${recipes} recettes / ${people} personnes - ${recipes * people} portions)`;
        } else {
            if (!PACKAGES[packageId as keyof typeof PACKAGES]) {
                return NextResponse.json({ success: false, error: 'Formule invalide.' }, { status: 400 });
            }
            const selectedPack = PACKAGES[packageId as keyof typeof PACKAGES];
            totalAmount = selectedPack.price;
            recipesCount = selectedPack.recipes;
            peopleCount = selectedPack.people;
            selectedPackName = selectedPack.name;
        }

        // Generate Voucher details
        const voucherCode = generateVoucherCode();
        
        // Expiry: Exactly 6 months (182.5 days) after the start date (defaults to today)
        const start = startDate ? new Date(startDate) : new Date();
        const expiry = new Date(start.getTime() + 182.5 * 24 * 60 * 60 * 1000);
        const day = String(expiry.getDate()).padStart(2, '0');
        const month = String(expiry.getMonth() + 1).padStart(2, '0');
        const year = expiry.getFullYear();
        const expiryDateStr = `${day}/${month}/${year}`; // DD/MM/YYYY

        // Format start date as DD/MM/YYYY for Sheets/N8N
        const sDay = String(start.getDate()).padStart(2, '0');
        const sMonth = String(start.getMonth() + 1).padStart(2, '0');
        const sYear = start.getFullYear();
        const startDateStr = `${sDay}/${sMonth}/${sYear}`;

        console.log(`[Manual Gift Card API] Creating manual gift card: ${voucherCode} for ${recipientName} from ${senderName}`);

        // Write to Google Sheet (including customText and startDateStr)
        const sheetSuccess = await createGiftCard({
            code: voucherCode,
            packageType: packageId,
            giver: senderName,
            recipient: recipientName,
            expiryDate: expiryDateStr,
            recipes: recipesCount,
            people: peopleCount,
            customText: customText || '',
            startDate: startDateStr
        });

        if (!sheetSuccess) {
            console.error('[Manual Gift Card API] Failed to write gift card to Google Sheets.');
            return NextResponse.json({ success: false, error: 'Erreur lors de l\'enregistrement dans la base de données (Google Sheets).' }, { status: 500 });
        }

        // Trigger N8N/Webhook Notification for Email delivery (marking stripe_session_id as "manual")
        const n8nPayload = {
            type: 'gift_card_purchased',
            code: voucherCode,
            package_id: packageId,
            giver_name: senderName,
            recipient_name: recipientName,
            message: message || '',
            delivery_email: deliveryEmail,
            expiry_date: expiryDateStr,
            recipes_count: recipesCount,
            people_count: peopleCount,
            stripe_session_id: 'manual', // Indicates manual invoice required
            amount_paid: totalAmount, // Pass total amount so invoice generation/PDF shows value
            start_date: startDateStr,
            custom_text: customText || '',
        };

        const productionUrl = process.env.NEXT_PUBLIC_N8N_GIFTCARD_WEBHOOK_URL || 'https://n8n-production-ced7.up.railway.app/webhook/1d46d22d-25e8-4684-9272-6a1e9a1760c6';
        
        try {
            await fetch(productionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(n8nPayload),
            });
        } catch (webhookErr) {
            console.error('[Manual Gift Card API] Failed to call N8N webhook:', webhookErr);
            // We do not fail the request if the webhook call fails, since the sheet creation succeeded.
        }

        return NextResponse.json({ 
            success: true, 
            code: voucherCode, 
            expiryDate: expiryDateStr,
            startDate: startDateStr,
            amount: totalAmount,
            packageName: selectedPackName,
            customText: customText || ''
        });
    } catch (error: any) {
        console.error('[Manual Gift Card API Error]:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Erreur lors de la génération de la carte cadeau.' },
            { status: 500 }
        );
    }
}
