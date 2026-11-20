import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isPreviewWithoutLogin } from '@/lib/previewAccess';

// Public endpoints inside protected prefixes
const PUBLIC_PATHS = ['/admin/login', '/api/cooking-ops/client'];

/**
 * Any failure (missing config, Supabase unreachable...) blocks access instead of crashing,
 * and logs the reason so it shows up in Vercel's logs.
 */
function failClosed(request: NextRequest, reason: string) {
    console.error(`[middleware] Access blocked: ${reason}`);
    if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Service momentanément indisponible' }, { status: 503 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.search = '?error=config';
    return NextResponse.redirect(loginUrl);
}

const AUTH_CHECK_TIMEOUT_MS = 8000;

/**
 * The saved login can't be checked: log why (Vercel logs), clear the Supabase login cookies so the
 * next visit starts clean, and send the person to the login page with a short explanation.
 */
function resetSession(request: NextRequest, reason: string) {
    console.error(`[middleware] Session reset: ${reason}`);
    const response = request.nextUrl.pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Session expirée, reconnectez-vous' }, { status: 401 })
        : (() => {
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = '/admin/login';
            loginUrl.search = `?error=session&next=${encodeURIComponent(request.nextUrl.pathname)}`;
            return NextResponse.redirect(loginUrl);
        })();
    request.cookies.getAll()
        .filter(c => c.name.startsWith('sb-'))
        .forEach(c => response.cookies.set(c.name, '', { path: '/', maxAge: 0 }));
    return response;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`))) {
        return NextResponse.next({ request });
    }

    // Preview deployments (not main): no login needed. Production always checks.
    if (isPreviewWithoutLogin(request.headers.get('host'))) {
        return NextResponse.next({ request });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
        const missing = [!supabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL', !supabaseKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY'].filter(Boolean);
        return failClosed(request, `missing env var(s) at build time: ${missing.join(', ')}`);
    }

    try {
        let response = NextResponse.next({ request });

        const supabase = createServerClient(supabaseUrl, supabaseKey, {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet, headers) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    response = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
                    Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
                }
            }
        });

        // Validates the session with Supabase Auth (not just the cookie contents).
        // Capped: when Supabase answers a token refresh oddly, the library retries for up to 30 s,
        // longer than Vercel lets middleware run (→ 504). Past the cap, the saved login is dropped
        // and the person is sent to the login page instead of a blank timeout.
        const result = await Promise.race([
            supabase.auth.getUser(),
            new Promise<'timeout'>(resolve => setTimeout(() => resolve('timeout'), AUTH_CHECK_TIMEOUT_MS))
        ]);
        if (result === 'timeout') {
            return resetSession(request, `Supabase auth check took over ${AUTH_CHECK_TIMEOUT_MS / 1000}s`);
        }
        const { data: { user }, error: authError } = result;

        // A saved login Supabase can't use (refresh token refused, odd answer): drop it, not loop on it
        if (!user && authError && authError.name !== 'AuthSessionMissingError') {
            return resetSession(request, `Supabase auth error: ${authError.name}: ${authError.message}`);
        }

        if (!user) {
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
            }
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = '/admin/login';
            loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
            return NextResponse.redirect(loginUrl);
        }

        // Role checks (owner vs assistant) happen in each API route via requireOwner()
        return response;
    } catch (error) {
        return failClosed(request, error instanceof Error ? error.message : String(error));
    }
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/welcome-villa/:path*',
        '/api/cooking-ops/:path*',
        '/api/admin/:path*'
    ]
};
