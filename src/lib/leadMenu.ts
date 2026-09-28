import { getPublicWeekMenu } from './db/menus';

/**
 * The week's menu, ready to drop into the "new lead" email that n8n sends.
 *
 * The simulator form adds these fields to its lead payload, so n8n no longer needs the old
 * Google Sheet: in the n8n email use {{ $json.body.weekly_menu_html }} (or _text / _label).
 * Only public info (dish names and categories), never Elisa's recipes.
 */
export interface LeadMenuFields {
    weekly_menu_label: string;
    weekly_menu_text: string;
    weekly_menu_html: string;
}

const esc = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function getLeadMenuFields(): Promise<LeadMenuFields | null> {
    try {
        const menu = await getPublicWeekMenu();
        if (!menu) return null;

        // Grouped by category, in the order Elisa placed the dishes (same as the /menu page)
        const groups: { category: string; names: string[] }[] = [];
        for (const dish of menu.recipes) {
            const category = dish.category || 'Autres';
            const group = groups.find(g => g.category.toLowerCase() === category.toLowerCase());
            if (group) group.names.push(dish.name);
            else groups.push({ category, names: [dish.name] });
        }

        const text = groups.map(g => `${g.category}\n${g.names.map(n => `• ${n}`).join('\n')}`).join('\n\n');
        const html = groups.map(g => `
            <p style="margin:16px 0 6px 0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;">${esc(g.category)}</p>
            <ul style="margin:0;padding-left:18px;color:#1c1917;">${g.names.map(n => `<li style="margin:4px 0;">${esc(n)}</li>`).join('')}</ul>`).join('');

        return { weekly_menu_label: menu.weekLabel, weekly_menu_text: text, weekly_menu_html: html };
    } catch (error) {
        console.error('[Lead menu] Could not load the week menu:', error);
        return null;
    }
}
