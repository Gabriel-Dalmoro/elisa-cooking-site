import { getSupabaseAdmin } from '../supabase/admin';

/**
 * « Lien envoyé »: Elisa (or the client's chef) sent the menu link to this client for this week.
 * Ticked when she copies the link or opens WhatsApp, and can be unticked (migration 011).
 */

const isMissingTable = (e: { code?: string; message?: string }) =>
    e.code === '42P01' || e.code === 'PGRST205' || /menu_link_sends/.test(e.message || '');

/** clientId → when the link was sent, for one week. Empty (never an error) before migration 011. */
export async function listLinkSends(weekStart: string): Promise<Record<string, string>> {
    const { data, error } = await getSupabaseAdmin()
        .from('menu_link_sends')
        .select('client_id, sent_at')
        .eq('week_start', weekStart);
    if (error) {
        if (!isMissingTable(error)) console.warn('Link sends unavailable:', error.message);
        return {};
    }
    return Object.fromEntries((data as { client_id: string; sent_at: string }[]).map(r => [r.client_id, r.sent_at]));
}

export async function setLinkSent(clientId: string, weekStart: string, sent: boolean, sentBy: string | null): Promise<void> {
    const table = getSupabaseAdmin().from('menu_link_sends');
    const { error } = sent
        ? await table.upsert({ client_id: clientId, week_start: weekStart, sent_at: new Date().toISOString(), sent_by: sentBy }, { onConflict: 'client_id,week_start' })
        : await table.delete().eq('client_id', clientId).eq('week_start', weekStart);
    if (error) {
        throw new Error(isMissingTable(error)
            ? 'Cette option n’est pas encore activée (migration 011 à lancer dans Supabase).'
            : `Enregistrement impossible : ${error.message}`);
    }
}
