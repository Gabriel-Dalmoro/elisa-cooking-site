import { getSupabaseAdmin } from '../supabase/admin';
import { ClientProfile, TimeSlot } from '../types/cooking-ops';
import { slotTimes } from './sessions';

/**
 * Recurring sessions: "this client, this day, this slot, every N weeks, cooked by this chef".
 * The sessions themselves are ordinary app sessions (no Google event), created ahead of time
 * by ensureSeriesSessions. A cancelled week stays as an ignored row so it is never re-created,
 * and a moved one keeps its planned date (series_date).
 */

export type SeriesFrequency = 1 | 2 | 4; // every N weeks

export interface SessionSeries {
    id: string;
    clientId: string;
    assignedTo: string | null;
    timeSlot: TimeSlot;
    everyWeeks: SeriesFrequency;
    startDate: string;
    endDate: string | null;
    active: boolean;
}

interface SeriesRow {
    id: string;
    client_id: string;
    assigned_to: string | null;
    time_slot: TimeSlot;
    every_weeks: number;
    start_date: string;
    end_date: string | null;
    active: boolean;
}

function rowToSeries(row: SeriesRow): SessionSeries {
    return {
        id: row.id,
        clientId: row.client_id,
        assignedTo: row.assigned_to,
        timeSlot: row.time_slot,
        everyWeeks: ([1, 2, 4].includes(row.every_weeks) ? row.every_weeks : 1) as SeriesFrequency,
        startDate: row.start_date,
        endDate: row.end_date,
        active: row.active
    };
}

// Plain calendar-date arithmetic on "YYYY-MM-DD" (no time zone involved)
export function addDaysIso(dateIso: string, days: number): string {
    const [y, m, d] = dateIso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Planned dates of a series between two dates (inclusive). */
export function seriesDates(series: Pick<SessionSeries, 'startDate' | 'endDate' | 'everyWeeks'>, fromIso: string, untilIso: string): string[] {
    const last = series.endDate && series.endDate < untilIso ? series.endDate : untilIso;
    const dates: string[] = [];
    for (let date = series.startDate; date <= last; date = addDaysIso(date, 7 * series.everyWeeks)) {
        if (date >= fromIso) dates.push(date);
    }
    return dates;
}

export async function listSeries(onlyActive = true): Promise<SessionSeries[]> {
    let query = getSupabaseAdmin().from('session_series').select('*').order('created_at', { ascending: true });
    if (onlyActive) query = query.eq('active', true);
    const { data, error } = await query;
    if (error) throw new Error(`Lecture des séances récurrentes impossible : ${error.message}`);
    return (data as SeriesRow[]).map(rowToSeries);
}

export async function getSeries(id: string): Promise<SessionSeries | null> {
    const { data, error } = await getSupabaseAdmin().from('session_series').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Lecture de la récurrence impossible : ${error.message}`);
    return data ? rowToSeries(data as SeriesRow) : null;
}

export async function createSeries(input: {
    clientId: string;
    assignedTo: string;
    timeSlot: TimeSlot;
    everyWeeks: SeriesFrequency;
    startDate: string;
    endDate: string | null;
}): Promise<SessionSeries> {
    const { data, error } = await getSupabaseAdmin()
        .from('session_series')
        .insert({
            client_id: input.clientId,
            assigned_to: input.assignedTo,
            time_slot: input.timeSlot,
            every_weeks: input.everyWeeks,
            start_date: input.startDate,
            end_date: input.endDate
        })
        .select('*')
        .single();
    if (error) {
        const missing = /session_series/.test(error.message) && /exist|schema cache/i.test(error.message);
        throw new Error(missing
            ? 'Les séances récurrentes ne sont pas encore activées (migration 007 à lancer dans Supabase).'
            : `Création de la récurrence impossible : ${error.message}`);
    }
    return rowToSeries(data as SeriesRow);
}

/**
 * Creates the missing sessions of every active series up to untilIso.
 * Idempotent: a planned date that already has a row (even cancelled or moved) is skipped.
 */
export async function ensureSeriesSessions(untilIso: string, clients: ClientProfile[]): Promise<void> {
    const series = await listSeries(true);
    if (series.length === 0) return;
    const clientById = new Map(clients.map(c => [c.id, c]));

    const rows = series.flatMap(s => {
        const client = clientById.get(s.clientId);
        if (!client) return [];
        return seriesDates(s, s.startDate, untilIso).map(date => ({
            gcal_event_id: null,
            client_id: client.id,
            calendar_title: null,
            display_name: client.name,
            date,
            time_slot: s.timeSlot,
            ...slotTimes(date, s.timeSlot),
            dish_count: client.defaultDishCount,
            person_count: client.personCount,
            assigned_to: s.assignedTo,
            series_id: s.id,
            series_date: date
        }));
    });
    if (rows.length === 0) return;

    // A week where the client is already booked on that slot (e.g. Elisa's Google booking) gets no second session
    const { data: booked, error: bookedError } = await getSupabaseAdmin()
        .from('cooking_sessions')
        .select('client_id, date, time_slot')
        .in('client_id', [...new Set(rows.map(r => r.client_id))])
        .gte('date', rows.reduce((min, r) => (r.date < min ? r.date : min), rows[0].date))
        .lte('date', untilIso)
        .is('series_id', null)
        .eq('ignored', false);
    if (bookedError) throw new Error(`Lecture des séances impossible : ${bookedError.message}`);
    const taken = new Set((booked || []).map(b => `${b.client_id}|${b.date}|${b.time_slot}`));
    const toCreate = rows.filter(r => !taken.has(`${r.client_id}|${r.date}|${r.time_slot}`));
    if (toCreate.length === 0) return;

    const { error } = await getSupabaseAdmin()
        .from('cooking_sessions')
        .upsert(toCreate, { onConflict: 'series_id,series_date', ignoreDuplicates: true });
    if (error) throw new Error(`Création des séances récurrentes impossible : ${error.message}`);
}

/**
 * Stops a series from a date on: no session is planned from that date, and the ones already
 * created from that date are removed. Earlier sessions are kept.
 */
export async function stopSeries(id: string, fromIso: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    const series = await getSeries(id);
    if (!series) throw new Error('Récurrence introuvable');

    const endDate = addDaysIso(fromIso, -1);
    const { error } = await supabase
        .from('session_series')
        .update({ end_date: endDate, active: endDate >= series.startDate, updated_at: new Date().toISOString() })
        .eq('id', id);
    if (error) throw new Error(`Arrêt de la récurrence impossible : ${error.message}`);

    const { error: deleteError } = await supabase
        .from('cooking_sessions')
        .delete()
        .eq('series_id', id)
        .gte('series_date', fromIso);
    if (deleteError) throw new Error(`Suppression des séances à venir impossible : ${deleteError.message}`);
}

/** Gives a series to another chef: the series and its sessions from fromIso on. */
export async function reassignSeries(id: string, assignedTo: string, fromIso: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { error } = await supabase.from('session_series').update({ assigned_to: assignedTo, updated_at: now }).eq('id', id);
    if (error) throw new Error(`Changement de chef impossible : ${error.message}`);
    const { error: sessionsError } = await supabase
        .from('cooking_sessions')
        .update({ assigned_to: assignedTo, updated_at: now })
        .eq('series_id', id)
        .gte('date', fromIso);
    if (sessionsError) throw new Error(`Changement de chef des séances impossible : ${sessionsError.message}`);
}
