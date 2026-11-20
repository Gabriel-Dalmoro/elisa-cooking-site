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

/**
 * Supabase is slow or answered oddly (a short hiccup on their side): keep the saved login and
 * show a « try again » page. One click works again as soon as Supabase answers normally.
 */
function authTemporarilyUnavailable(request: NextRequest, reason: string) {
    console.error(`[middleware] Auth check unavailable: ${reason}`);
    if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Connexion momentanément lente, réessayez dans un instant' }, { status: 503 });
    }
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Réessayez dans un instant</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fafaf9;font-family:system-ui,-apple-system,sans-serif;color:#1c1917">
<main style="max-width:360px;margin:16px;padding:28px;background:#fff;border:1px solid #e7e5e4;border-radius:24px;text-align:center">
<h1 style="font-size:18px;margin:0 0 8px">Connexion momentanément lente</h1>
<p style="font-size:14px;color:#57534e;margin:0 0 20px">Vous êtes toujours connectée. Réessayez dans un instant.</p>
<button onclick="location.reload()" style="font:inherit;font-weight:600;font-size:14px;padding:10px 22px;border:0;border-radius:999px;background:#1c1917;color:#fff;cursor:pointer">Réessayer</button>
</main></body></html>`;
    return new NextResponse(html, { status: 503, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'retry-after': '10' } });
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
        // longer than Vercel lets middleware run (→ 504 MIDDLEWARE_INVOCATION_TIMEOUT).
        const result = await Promise.race([
            supabase.auth.getUser(),
            new Promise<'timeout'>(resolve => setTimeout(() => resolve('timeout'), AUTH_CHECK_TIMEOUT_MS))
        ]);
        if (result === 'timeout') {
            return authTemporarilyUnavailable(request, `Supabase auth check took over ${AUTH_CHECK_TIMEOUT_MS / 1000}s`);
        }
        const { data: { user }, error: authError } = result;

        if (!user && authError && authError.name !== 'AuthSessionMissingError') {
            const reason = `${authError.name} (${authError.status ?? 'no status'}): ${authError.message}`;
            // Supabase clearly refused the saved login (e.g. refresh token no longer valid):
            // refreshing can't fix it, so drop it and ask to log in again.
            const refused = authError.name === 'AuthApiError' && [400, 401, 403].includes(authError.status ?? 0);
            return refused ? resetSession(request, reason) : authTemporarilyUnavailable(request, reason);
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
