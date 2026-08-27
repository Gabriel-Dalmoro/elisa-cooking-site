export function getSupabaseConfig() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return {
        url,
        key,
        isConfigured: Boolean(url && key)
    };
}

export const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
);

interface SupabaseQueryOptions {
    headers?: Record<string, string>;
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
}

export async function supabaseFetch<T = unknown>(
    endpoint: string,
    options: SupabaseQueryOptions = {}
): Promise<T | null> {
    const config = getSupabaseConfig();
    if (!config.isConfigured || !config.url || !config.key) {
        return null;
    }

    try {
        const url = `${config.url}/rest/v1/${endpoint}`;
        const headers: Record<string, string> = {
            'apikey': config.key,
            'Authorization': `Bearer ${config.key}`,
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
