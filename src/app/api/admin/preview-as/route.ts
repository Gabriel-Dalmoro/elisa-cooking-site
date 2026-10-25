import { NextRequest, NextResponse } from 'next/server';
import { isPreviewWithoutLogin, PREVIEW_AS_COOKIE } from '@/lib/previewAccess';

/**
 * Preview deployments only: remember which chef's view to show (« Voir comme Lucas »).
 * Does nothing anywhere else (production, local).
 */
export async function POST(req: NextRequest) {
    if (!isPreviewWithoutLogin(req.headers.get('host'))) {
        return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
    }
    const { userId } = await req.json().catch(() => ({ userId: null }));
    const res = NextResponse.json({ success: true });
    if (typeof userId === 'string' && /^[0-9a-f-]{36}$/i.test(userId)) {
        res.cookies.set(PREVIEW_AS_COOKIE, userId, { httpOnly: true, sameSite: 'lax', secure: true, path: '/' });
    } else {
        res.cookies.delete(PREVIEW_AS_COOKIE);
    }
    return res;
}
