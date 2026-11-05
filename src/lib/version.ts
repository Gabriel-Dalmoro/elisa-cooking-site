import pkg from '../../package.json';

/**
 * App version shown discreetly on the admin and chef dashboards.
 *
 * ONE source: the "version" in package.json. Bump it on every change merged to main and put it
 * in the commit / merge message (e.g. "fix(crm): ... [v1.1.1]"), so the number on screen tells
 * exactly what is running on prod vs preview. Rules in CLAUDE.md.
 *
 *   0.x    — alpha: Elisa's first season, features still moving
 *   1.0.0  — first team version: chef accounts (Lucas), clients and sessions assigned by Elisa
 *   1.1.0  — diet-adapted menus
 *
 * Patch (1.1.1) = fix or small change · Minor (1.2.0) = new capability · Major (2.0.0) = big change in how it works.
 */
export const APP_VERSION: string = pkg.version;

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
