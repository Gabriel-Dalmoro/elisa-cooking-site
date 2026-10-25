import { getSupabaseAdmin } from '../supabase/admin';
import { BookingSession, TimeSlot } from '../types/cooking-ops';
import { getParisDateTimeInfo, getParisUtcOffset } from '../dateUtils';

/**
 * Cooking sessions. Elisa's come from her Google Calendar (Google stays the source of truth for them);
 * fields set in the app (assigned chef, ignored) survive every re-sync.
 * Chefs' sessions are created in the app and have no Google event (gcal_event_id null):
 * the sync never touches them.
 */

interface SessionRow {
    id: string;
    gcal_event_id: string | null;
    client_id: string | null;
    calendar_title: string | null;
    display_name: string;
    date: string;
    time_slot: TimeSlot;
    starts_at: string | null;
    ends_at: string | null;
    dish_count: number;
    person_count: number;
    assigned_to: string | null;
    ignored: boolean;
    created_at: string;
}

function rowToSession(row: SessionRow): BookingSession {
    return {
        id: row.id,
        clientId: row.client_id || '',
        clientName: row.display_name,
        dateIso: row.date,
        dayName: getParisDateTimeInfo(row.date).dayName,
        timeSlot: row.time_slot,
        startsAt: row.starts_at || undefined,
        endsAt: row.ends_at || undefined,
        dishCount: row.dish_count,
        personCount: row.person_count,
        gcalEventId: row.gcal_event_id || undefined,
        notes: row.calendar_title || undefined,
        assignedTo: row.assigned_to,
        createdAt: row.created_at
    };
}

export interface SessionInput {
    gcalEventId: string;
    clientId: string | null;
    calendarTitle: string;
    displayName: string;
    dateIso: string;
    timeSlot: TimeSlot;
    startsAt: string | null;
    endsAt: string | null;
    dishCount: number;
    personCount: number;
}

function inputToRow(s: SessionInput) {
    // assigned_to and ignored are deliberately absent: a re-sync must not reset them
    return {
        gcal_event_id: s.gcalEventId,
        client_id: s.clientId,
        calendar_title: s.calendarTitle,
        display_name: s.displayName,
        date: s.dateIso,
        time_slot: s.timeSlot,
        starts_at: s.startsAt,
        ends_at: s.endsAt,
        dish_count: s.dishCount,
        person_count: s.personCount,
        updated_at: new Date().toISOString()
    };
}

/** Sessions of a date range: everyone's, or only those assigned to one chef. */
export async function listSessions(startIso: string, endIso: string, assignedTo?: string): Promise<BookingSession[]> {
    let query = getSupabaseAdmin()
        .from('cooking_sessions')
        .select('*')
        .gte('date', startIso)
        .lte('date', endIso)
        .eq('ignored', false)
        .order('date', { ascending: true })
        .order('starts_at', { ascending: true, nullsFirst: false });
    if (assignedTo) query = query.eq('assigned_to', assignedTo);
    const { data, error } = await query;
    if (error) throw new Error(`Lecture des séances impossible : ${error.message}`);
    return (data as SessionRow[]).map(rowToSession);
}

export async function getSession(id: string): Promise<BookingSession | null> {
    const { data, error } = await getSupabaseAdmin()
        .from('cooking_sessions')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error) throw new Error(`Lecture de la séance impossible : ${error.message}`);
    return data ? rowToSession(data as SessionRow) : null;
}

export async function upsertSession(input: SessionInput): Promise<void> {
    const { error } = await getSupabaseAdmin()
        .from('cooking_sessions')
        .upsert(inputToRow(input), { onConflict: 'gcal_event_id' });
    if (error) throw new Error(`Enregistrement de la séance impossible : ${error.message}`);
}

/**
 * Makes the stored sessions of [startIso, endIso] match what Google Calendar returned:
 * upserts every event, and removes sessions whose event was deleted or moved out of the range.
 * Only call this after a SUCCESSFUL Google fetch (an empty list means "no events", not "error").
 */
export async function replaceSessionsForRange(startIso: string, endIso: string, sessions: SessionInput[]): Promise<void> {
    const supabase = getSupabaseAdmin();

    if (sessions.length > 0) {
        const { error } = await supabase
            .from('cooking_sessions')
            .upsert(sessions.map(inputToRow), { onConflict: 'gcal_event_id' });
        if (error) throw new Error(`Synchronisation des séances impossible : ${error.message}`);
    }

    let staleQuery = supabase
        .from('cooking_sessions')
        .delete()
        .gte('date', startIso)
        .lte('date', endIso)
        .not('gcal_event_id', 'is', null);
    if (sessions.length > 0) {
        const quotedIds = sessions.map(s => `"${s.gcalEventId.replace(/"/g, '')}"`).join(',');
        staleQuery = staleQuery.not('gcal_event_id', 'in', `(${quotedIds})`);
    }
    const { error: deleteError } = await staleQuery;
    if (deleteError) throw new Error(`Nettoyage des séances impossible : ${deleteError.message}`);
}

export async function setSessionIgnored(id: string, ignored: boolean): Promise<void> {
    const { error } = await getSupabaseAdmin()
        .from('cooking_sessions')
        .update({ ignored, updated_at: new Date().toISOString() })
        .eq('id', id);
    if (error) throw new Error(`Mise à jour de la séance impossible : ${error.message}`);
}

export async function deleteSession(id: string): Promise<void> {
    const { error } = await getSupabaseAdmin()
        .from('cooking_sessions')
        .delete()
        .eq('id', id);
    if (error) throw new Error(`Suppression de la séance impossible : ${error.message}`);
}

// Same hours as Elisa's Google Calendar events (09:00–12:00 / 14:00–17:00, Paris)
function slotTimes(dateIso: string, timeSlot: TimeSlot) {
    const offset = getParisUtcOffset(dateIso);
    const [startHour, endHour] = timeSlot === 'Matin' ? ['09:00', '12:00'] : ['14:00', '17:00'];
    return { starts_at: `${dateIso}T${startHour}:00${offset}`, ends_at: `${dateIso}T${endHour}:00${offset}` };
}

/**
 * A session that lives only in the app (a chef's session: no Google Calendar event).
 */
export async function createAppSession(input: {
    clientId: string;
    displayName: string;
    dateIso: string;
    timeSlot: TimeSlot;
    dishCount: number;
    personCount: number;
    assignedTo: string | null;
}): Promise<BookingSession> {
    const { data, error } = await getSupabaseAdmin()
        .from('cooking_sessions')
        .insert({
            gcal_event_id: null,
            client_id: input.clientId,
            calendar_title: null,
            display_name: input.displayName,
            date: input.dateIso,
            time_slot: input.timeSlot,
            ...slotTimes(input.dateIso, input.timeSlot),
            dish_count: input.dishCount,
            person_count: input.personCount,
            assigned_to: input.assignedTo
        })
        .select('*')
        .single();
    if (error) throw new Error(`Création de la séance impossible : ${error.message}`);
    return rowToSession(data as SessionRow);
}

/** Moves an app-only session (Google Calendar sessions are moved in Google Calendar). */
export async function rescheduleAppSession(id: string, dateIso: string, timeSlot: TimeSlot): Promise<BookingSession> {
    const { data, error } = await getSupabaseAdmin()
        .from('cooking_sessions')
        .update({ date: dateIso, time_slot: timeSlot, ...slotTimes(dateIso, timeSlot), updated_at: new Date().toISOString() })
        .eq('id', id)
        .is('gcal_event_id', null)
        .select('*')
        .maybeSingle();
    if (error) throw new Error(`Déplacement de la séance impossible : ${error.message}`);
    if (!data) throw new Error('Cette séance vient de Google Calendar : déplacez-la dans votre agenda.');
    return rowToSession(data as SessionRow);
}

/** Who cooks this session (null = Elisa). */
export async function setSessionAssignee(id: string, assignedTo: string | null): Promise<BookingSession> {
    const { data, error } = await getSupabaseAdmin()
        .from('cooking_sessions')
        .update({ assigned_to: assignedTo, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .maybeSingle();
    if (error) throw new Error(`Attribution de la séance impossible : ${error.message}`);
    if (!data) throw new Error('Séance introuvable');
    return rowToSession(data as SessionRow);
}
