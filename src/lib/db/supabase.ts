// Lightweight native Supabase client (Zero-dependency PostgREST helper)
// Connects to Supabase if NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY are present in .env.local

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

interface SupabaseQueryOptions {
    headers?: Record<string, string>;
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
}

export async function supabaseFetch<T = unknown>(
    endpoint: string,
    options: SupabaseQueryOptions = {}
): Promise<T | null> {
    if (!isSupabaseConfigured) {
        return null;
    }

    try {
        const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
        const headers: Record<string, string> = {
            'apikey': SUPABASE_KEY!,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
            ...(options.headers || {})
        };

        const res = await fetch(url, {
            method: options.method || 'GET',
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
            cache: 'no-store'
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`Supabase error [${res.status}] ${endpoint}:`, errorText);
            return null;
        }

        return await res.json() as T;
    } catch (e) {
        console.error('Supabase fetch exception:', e);
        return null;
    }
}
