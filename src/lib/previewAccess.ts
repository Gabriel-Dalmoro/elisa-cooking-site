/**
 * Preview deployments skip the admin login, so Gabriel and Elisa can test a branch in one tap.
 *
 * Both conditions come from Vercel's own system variables (server side, can't be set by a visitor):
 *   - VERCEL_ENV is 'preview' (production is 'production'; local dev has none → normal login)
 *   - the branch is not main (main always has the normal login, even if ever deployed as a preview)
 * And never on the real site's domain (in case a preview deployment is ever promoted to production).
 * Anything else, missing or unexpected → normal login.
 */
const PRODUCTION_DOMAIN = 'elisabatchcooking.com';

export function isPreviewWithoutLogin(host: string | null | undefined): boolean {
    const hostname = (host || '').toLowerCase().split(':')[0];
    if (!hostname || hostname === PRODUCTION_DOMAIN || hostname.endsWith(`.${PRODUCTION_DOMAIN}`)) return false;
    return process.env.VERCEL_ENV === 'preview'
        && Boolean(process.env.VERCEL_GIT_COMMIT_REF)
        && process.env.VERCEL_GIT_COMMIT_REF !== 'main';
}

/** Who is "logged in" on a preview without login: acts as Elisa (owner). */
export const PREVIEW_STAFF = {
    userId: 'preview',
    role: 'owner' as const,
    displayName: 'Aperçu (sans connexion)'
};
