import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Public endpoints inside protected prefixes
const PUBLIC_PATHS = ['/admin/login', '/api/cooking-ops/client'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`))) {
        return NextResponse.next({ request });
    }

    let response = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
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
        }
    );

    // Validates the session with Supabase Auth (not just the cookie contents)
    const { data: { user } } = await supabase.auth.getUser();

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
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/welcome-villa/:path*',
        '/api/cooking-ops/:path*',
        '/api/admin/:path*'
    ]
};
