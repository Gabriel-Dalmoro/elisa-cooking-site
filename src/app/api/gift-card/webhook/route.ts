import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createGiftCard } from '@/lib/googleSheets';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Generate a random readable unique code: ECBC-XXXXX
function generateVoucherCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars (I, O, 0, 1, 1)
    let code = 'ECBC-';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function POST(request: Request) {
    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature') || '';

        let event: Stripe.Event;

        // 1. Verify Webhook Signature
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err: any) {
            console.error(`[Webhook Signature Verification Failed]:`, err.message);
            return NextResponse.json({ success: false, error: 'Signature invalide.' }, { status: 400 });
        }

        // 2. Handle checkout.session.completed Event
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const metadata = session.metadata;

            if (metadata) {
                const { packageId, senderName, recipientName, message, deliveryEmail, recipes, people } = metadata;

                // Create Voucher Details
                const voucherCode = generateVoucherCode();
                
                // Expiry: Exactly 6 months (182.5 days)
                const expiry = new Date(Date.now() + 182.5 * 24 * 60 * 60 * 1000);
                const day = String(expiry.getDate()).padStart(2, '0');
                const month = String(expiry.getMonth() + 1).padStart(2, '0');
                const year = expiry.getFullYear();
                const expiryDateStr = `${day}/${month}/${year}`; // DD/MM/YYYY

                console.log(`[Webhook] Creating gift card: ${voucherCode} for ${recipientName} from ${senderName}`);

                // Write to Google Sheet
                const sheetSuccess = await createGiftCard({
                    code: voucherCode,
                    packageType: packageId,
                    giver: senderName,
                    recipient: recipientName,
                    expiryDate: expiryDateStr,
                    recipes: parseInt(recipes) || 4,
                    people: parseInt(people) || 4,
                });

                if (!sheetSuccess) {
                    console.error('[Webhook] Failed to write gift card to Google Sheets.');
                }

                // Trigger N8N/Webhook Notification for Email delivery
                const n8nPayload = {
                    type: 'gift_card_purchased',
                    code: voucherCode,
                    package_id: packageId,
                    giver_name: senderName,
                    recipient_name: recipientName,
                    message,
                    delivery_email: deliveryEmail,
                    expiry_date: expiryDateStr,
                    recipes_count: parseInt(recipes) || 4,
                    people_count: parseInt(people) || 4,
                    stripe_session_id: session.id,
                    amount_paid: session.amount_total ? session.amount_total / 100 : 0,
                };

                const productionUrl = process.env.NEXT_PUBLIC_N8N_GIFTCARD_WEBHOOK_URL || 'https://n8n-production-ced7.up.railway.app/webhook/1d46d22d-25e8-4684-9272-6a1e9a1760c6';
                try {
                    await fetch(productionUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(n8nPayload),
                    });
                } catch (webhookErr) {
                    console.error('[Webhook] Failed to call N8N webhook:', webhookErr);
                }
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('[Stripe Webhook Error]:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
