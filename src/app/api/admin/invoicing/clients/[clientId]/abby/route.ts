import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth';
import { createAbbyContactFor, getAbbyLink, linkAbbyContact, unlinkAbbyContact } from '@/lib/db/invoicing';

type Params = { params: Promise<{ clientId: string }> };

const errorResponse = (error: unknown) =>
    NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 400 });

/**
 * GET ?q= → the client's Abby contact, or contacts to choose from (searched by name: Abby can't
 * search by e-mail). With the « manual » provider: { enabled: false }, and Abby is never called.
 */
export async function GET(req: NextRequest, { params }: Params) {
    const denied = await requireOwner();
    if (denied) return denied;
    try {
        const { clientId } = await params;
        const query = req.nextUrl.searchParams.get('q')?.slice(0, 80) || undefined;
        return NextResponse.json(await getAbbyLink(clientId, query));
    } catch (error) {
        return errorResponse(error);
    }
}

/** POST { action: 'link', contactId } | { action: 'create' } | { action: 'unlink' } */
export async function POST(req: NextRequest, { params }: Params) {
    const denied = await requireOwner();
    if (denied) return denied;
    try {
        const { clientId } = await params;
        const body = await req.json();
        if (body.action === 'link' && typeof body.contactId === 'string' && body.contactId) {
            return NextResponse.json({ success: true, contact: await linkAbbyContact(clientId, body.contactId) });
        }
        if (body.action === 'create') {
            return NextResponse.json({ success: true, contact: await createAbbyContactFor(clientId) });
        }
        if (body.action === 'unlink') {
            await unlinkAbbyContact(clientId);
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
    } catch (error) {
        return errorResponse(error);
    }
}
