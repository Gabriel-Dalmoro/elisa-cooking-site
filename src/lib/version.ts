/**
 * App version shown discreetly on the admin home page.
 *
 * CONVENTION: bump this on every commit that changes the app, and put the new
 * version in the commit message (e.g. "fix(crm): ... [v0.9.1]"). That way the
 * number on screen tells you exactly what is running on prod vs preview.
 *
 *   0.x    — alpha: Elisa's first season, features still moving
 *   1.0.0  — first team version: chef accounts (Lucas), clients and sessions assigned by Elisa
 *
 * Patch (1.0.1) = fix or small change · Minor (1.1.0) = new capability · Major (2.0.0) = big change in how it works.
 */
export const APP_VERSION = '1.0.0';

/**
 * Where this build is running. Vercel fills these in at build time when
 * "Automatically expose System Environment Variables" is on (Project Settings).
 */
export function getBuildInfo(): { version: string; env: string | null; commit: string | null } {
    const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV || null;
    const sha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || null;

    const env = vercelEnv === 'production' ? null // production is the normal case: no label needed
        : vercelEnv === 'preview' ? 'préproduction'
        : vercelEnv === 'development' ? 'local'
        : process.env.NODE_ENV === 'development' ? 'local'
        : null;

    return { version: APP_VERSION, env, commit: sha ? sha.slice(0, 7) : null };
}
