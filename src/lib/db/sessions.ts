import { getSupabaseAdmin } from '../supabase/admin';
import { BookingSession, TimeSlot } from '../types/cooking-ops';
import { getParisDateTimeInfo } from '../dateUtils';

/**
 * Cooking sessions, mirrored from Google Calendar (Google stays the source of truth for the schedule).
 * Fields set in the app (assigned chef, ignored) survive every re-sync.
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

export async function listSessions(startIso: string, endIso: string): Promise<BookingSession[]> {
    const { data, error } = await getSupabaseAdmin()
        .from('cooking_sessions')
        .select('*')
        .gte('date', startIso)
        .lte('date', endIso)
        .eq('ignored', false)
        .order('date', { ascending: true })
        .order('starts_at', { ascending: true, nullsFirst: false });
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
