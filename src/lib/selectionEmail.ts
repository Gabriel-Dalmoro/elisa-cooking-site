import { BookingSession, ClientProfile, ClientSelection, WeeklyMenuData } from './types/cooking-ops';
import { getWeekBoundsForStart } from './dateUtils';
import { listSessions } from './db/sessions';

/**
 * Email to Elisa when a client sends their dish choices.
 *
 * Sent through an n8n webhook (same setup as the gift card emails): the app builds the
 * whole email, n8n only delivers it. Payload: { to, subject, html, text }.
 * Nothing is sent if N8N_SELECTION_WEBHOOK_URL is not set. A failure never blocks the client.
 */

const DEFAULT_RECIPIENT = 'contactchefelisa@gmail.com';

const esc = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const nl2br = (value: string) => esc(value).replace(/\n/g, '<br>');

function sessionLabel(s: BookingSession): string {
    const date = s.dateIso.split('-').reverse().join('/');
    return `${s.dayName} ${date} — ${s.timeSlot} · ${s.dishCount} plats · ${s.personCount} pers.`;
}

function section(title: string, body: string): string {
    return `
        <tr><td style="padding:20px 28px 0 28px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;margin-bottom:8px;">${esc(title)}</div>
            ${body}
        </td></tr>`;
}

function button(href: string, label: string): string {
    return `<a href="${esc(href)}" style="display:inline-block;background:#E1567A;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:10px 18px;border-radius:999px;margin:0 6px 8px 0;">${esc(label)}</a>`;
}

export function buildSelectionEmail(input: {
    client: ClientProfile;
    selection: ClientSelection;
    menu: WeeklyMenuData;
    sessions: BookingSession[];
    baseUrl: string;
}): { subject: string; html: string; text: string } {
    const { client, selection, menu, sessions, baseUrl } = input;
    const dishes = selection.selectedDishIds.map((id, i) => ({
        name: menu.recipes.find(d => d.id === id)?.name || selection.selectedDishNames[i] || id,
        note: selection.dishNotes[id] || ''
    }));
    const total = dishes.length + (selection.customDish ? 1 : 0);
    const added = selection.allergiesAdded;
    const allergies = selection.allergiesAtSubmission;

    const subject = `${added.length > 0 ? '⚠️ ' : ''}${client.name} a choisi ses plats — ${menu.weekLabel}`;

    const dishRows = dishes.map((d, i) => `
        <div style="padding:10px 0;border-bottom:1px solid #f5f5f4;">
            <span style="color:#E1567A;font-weight:700;">${i + 1}.</span>
            <span style="font-weight:600;color:#1c1917;">${esc(d.name)}</span>
            ${d.note ? `<div style="font-size:13px;color:#78716c;font-style:italic;margin:4px 0 0 18px;">« ${esc(d.note)} »</div>` : ''}
        </div>`).join('');

    const customRow = selection.customDish
        ? `<div style="margin-top:10px;padding:12px 14px;background:#fff1f4;border:1px dashed #E1567A;border-radius:12px;">
                <div style="font-size:11px;font-weight:700;color:#E1567A;text-transform:uppercase;letter-spacing:1px;">${dishes.length + 1}. Plat sur mesure demandé</div>
                <div style="font-weight:600;color:#1c1917;margin-top:4px;">${nl2br(selection.customDish)}</div>
           </div>`
        : '';

    const allergyBody = `
        ${allergies.length > 0
            ? allergies.map(a => `<span style="display:inline-block;margin:0 6px 6px 0;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;${added.includes(a) ? 'background:#dc2626;color:#ffffff;' : 'background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;'}">⚠️ ${esc(a)}${added.includes(a) ? ' (nouvelle)' : ''}</span>`).join('')
            : '<div style="color:#a8a29e;font-size:13px;">Aucune allergie enregistrée</div>'}
        ${added.length > 0 ? `<div style="margin-top:6px;font-size:13px;color:#b91c1c;font-weight:700;">Le client a ajouté lui-même : ${esc(added.join(', '))}</div>` : ''}
        ${client.dislikes ? `<div style="margin-top:6px;font-size:13px;color:#57534e;">N'aime pas : ${esc(client.dislikes)}</div>` : ''}`;

    const practical = [
        client.phone && `📞 ${esc(client.phone)}`,
        client.email && `✉️ ${esc(client.email)}`,
        client.address && `📍 ${esc(client.address)}`,
        client.accessCode && `🔑 Code d'accès : ${esc(client.accessCode)}`,
        client.notes && `🍳 ${nl2br(client.notes)}`
    ].filter(Boolean).map(line => `<div style="font-size:13px;color:#44403c;padding:3px 0;">${line}</div>`).join('');

    const sessionBody = sessions.length > 0
        ? sessions.map(s => `<div style="font-size:14px;font-weight:600;color:#1c1917;padding:3px 0;">📅 ${esc(sessionLabel(s))}</div>`).join('')
        : `<div style="font-size:13px;color:#b45309;">Aucune séance trouvée cette semaine dans le planning (formule : ${client.defaultDishCount} plats · ${client.personCount} pers.).</div>`;

    const buttons = [
        ...sessions.map(s => button(`${baseUrl}/admin/cuisine/${encodeURIComponent(s.id)}`, sessions.length > 1 ? `Fiche cuisine (${s.dayName})` : 'Ouvrir la fiche cuisine')),
        button(`${baseUrl}/admin/semaine`, 'Voir le planning')
    ].join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#fafaf9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1c1917;line-height:1.5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e7e5e4;border-radius:20px;overflow:hidden;">
    <tr><td style="background:#E1567A;padding:24px 28px;color:#ffffff;">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;opacity:0.85;">Nouveaux choix reçus</div>
        <div style="font-size:24px;font-weight:700;margin-top:4px;">${esc(client.name)}</div>
        <div style="font-size:14px;opacity:0.9;margin-top:2px;">${esc(menu.weekLabel)} · ${total} plat${total > 1 ? 's' : ''} · ${client.personCount} pers.</div>
    </td></tr>
    ${section('Séance', sessionBody)}
    ${section(`Plats choisis (${total})`, dishRows + customRow)}
    ${selection.generalNote ? section('Message du client', `<div style="font-size:14px;color:#44403c;background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:12px 14px;">${nl2br(selection.generalNote)}</div>`) : ''}
    ${section('Allergies & préférences', allergyBody)}
    ${practical ? section('Infos pratiques', practical) : ''}
    <tr><td style="padding:24px 28px 20px 28px;">${buttons}</td></tr>
    <tr><td style="padding:0 28px 24px 28px;font-size:11px;color:#a8a29e;">
        Envoyé automatiquement le ${esc(new Date(selection.submittedAt).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'long', timeStyle: 'short' }))}.
    </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

    const text = [
        `${client.name} — ${menu.weekLabel}`,
        '',
        'Séance :',
        ...(sessions.length > 0 ? sessions.map(s => `- ${sessionLabel(s)}`) : ['- aucune séance trouvée cette semaine']),
        '',
        `Plats choisis (${total}) :`,
        ...dishes.map((d, i) => `${i + 1}. ${d.name}${d.note ? ` — « ${d.note} »` : ''}`),
        ...(selection.customDish ? [`${dishes.length + 1}. SUR MESURE : ${selection.customDish}`] : []),
        ...(selection.generalNote ? ['', `Message : ${selection.generalNote}`] : []),
        '',
        `Allergies : ${allergies.length > 0 ? allergies.join(', ') : 'aucune'}${added.length > 0 ? ` (ajoutées par le client : ${added.join(', ')})` : ''}`,
        ...(client.dislikes ? [`N'aime pas : ${client.dislikes}`] : []),
        '',
        `Planning : ${baseUrl}/admin/semaine`
    ].join('\n');

    return { subject, html, text };
}

export async function sendSelectionEmail(input: {
    client: ClientProfile;
    selection: ClientSelection;
    menu: WeeklyMenuData;
    baseUrl: string;
}): Promise<void> {
    const webhookUrl = process.env.N8N_SELECTION_WEBHOOK_URL;
    if (!webhookUrl) {
        console.warn('[Selection email] N8N_SELECTION_WEBHOOK_URL is not set: no email sent');
        return;
    }

    try {
        const { startIso, endIso } = getWeekBoundsForStart(input.selection.weekStart);
        const sessions = (await listSessions(startIso, endIso)).filter(s => s.clientId === input.client.id);
        const email = buildSelectionEmail({ ...input, sessions });

        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: process.env.SELECTION_NOTIFY_EMAIL || DEFAULT_RECIPIENT, ...email }),
            signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) console.error(`[Selection email] Webhook answered ${res.status}`);
    } catch (error) {
        console.error('[Selection email] Could not send:', error);
    }
}
