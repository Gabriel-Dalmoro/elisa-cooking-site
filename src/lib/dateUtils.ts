/**
 * Date utility functions for weekly planning and calendar views.
 * Pure JavaScript - Safe for both Client and Server components.
 * Configured specifically for Europe/Paris timezone.
 */

export const FRENCH_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
export const WEEK_DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

/**
 * Formats a Date object to "YYYY-MM-DD" using local calendar components (prevents UTC timezone shift).
 */
export function formatLocalDateToIso(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Parses any ISO datetime string or Date object specifically in 'Europe/Paris' timezone.
 */
export function getParisDateTimeInfo(input: string | Date): {
    isoDate: string; // "YYYY-MM-DD" in Paris
    dayName: string; // "Lundi", "Mardi", etc.
    dayNumber: number; // 17, 18, etc.
    monthName: string; // "août", "sept.", etc.
    year: number;
    hour: number; // 0-23 in Paris
    timeSlot: 'Matin' | 'Après-midi';
} {
    // If it's a date-only string e.g. "2026-08-17"
    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
        const [y, m, d] = input.split('-').map(n => parseInt(n, 10));
        const sampleDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        const dayIdx = sampleDate.getUTCDay();
        const monthName = sampleDate.toLocaleDateString('fr-FR', { month: 'short', timeZone: 'Europe/Paris' });
        return {
            isoDate: input,
            dayName: FRENCH_DAYS[dayIdx],
            dayNumber: d,
            monthName,
            year: y,
            hour: 9,
            timeSlot: 'Matin'
        };
    }

    const dateObj = typeof input === 'string' ? new Date(input) : input;
    
    // Format parts explicitly in Europe/Paris
    const dtf = new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Europe/Paris',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'long',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
    });

    const parts = dtf.formatToParts(dateObj);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

    const year = parseInt(getPart('year'), 10) || dateObj.getFullYear();
    const month = getPart('month');
    const day = getPart('day');
    const weekdayRaw = getPart('weekday') || 'lundi';
    const hour = parseInt(getPart('hour'), 10) || 0;

    const isoDate = `${year}-${month}-${day}`;
    const dayName = weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1).toLowerCase();
    const dayNumber = parseInt(day, 10) || dateObj.getDate();
    const monthName = dateObj.toLocaleDateString('fr-FR', { month: 'short', timeZone: 'Europe/Paris' });
    
    // In Paris time: Morning is < 13:00, Afternoon is >= 13:00
    const timeSlot: 'Matin' | 'Après-midi' = hour < 13 ? 'Matin' : 'Après-midi';

    return {
        isoDate,
        dayName,
        dayNumber,
        monthName,
        year,
        hour,
        timeSlot
    };
}

/**
 * UTC offset of Paris on a given calendar date, e.g. "+02:00" (summer) or "+01:00" (winter).
 * Probes at 12:00 UTC: DST switches happen at night, so noon always has that day's final offset
 * (correct for the Monday 00:00 / Sunday 23:59 week bounds, since switches fall on Sundays).
 */
export function getParisUtcOffset(dateIso: string): string {
    const [y, m, d] = dateIso.split('-').map(n => parseInt(n, 10));
    const probe = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const tzName = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', timeZoneName: 'longOffset' })
        .formatToParts(probe)
        .find(p => p.type === 'timeZoneName')?.value || '';
    const match = tzName.match(/GMT([+-]\d{2}:\d{2})/);
    return match ? match[1] : '+01:00';
}

/**
 * Calculates start and end dates for the target week (Monday to Friday / Sunday) in Paris time.
 * offsetWeeks = 0 for current week, -1 for previous week, +1 for next week, etc.
 */
export function getWeekBounds(offsetWeeks = 0): { 
    start: Date; 
    end: Date; 
    weekLabel: string; 
    dateRangeOnly: string;
    startIso: string;
    endIso: string;
    mondayDate: Date;
    daysWithDates: {
        dayName: string;
        dateNumber: number;
        monthName: string;
        isoDate: string;
        formattedHeader: string;
        isToday: boolean;
    }[];
} {
    const todayParis = getParisDateTimeInfo(new Date());
    const todayIso = todayParis.isoDate;

    // Construct local Paris date
    const [tYear, tMonth, tDay] = todayIso.split('-').map(n => parseInt(n, 10));
    const currentParisDate = new Date(tYear, tMonth - 1, tDay);
    const dayOfWeek = currentParisDate.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = (dayOfWeek + 6) % 7;

    const monday = new Date(currentParisDate);
    monday.setDate(currentParisDate.getDate() - distanceToMonday + (offsetWeeks * 7));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const startIso = formatLocalDateToIso(monday);
    const endIso = formatLocalDateToIso(sunday);

    const startFormatted = `${monday.getDate()} ${monday.toLocaleDateString('fr-FR', { month: 'long' })}`;
    const endFormatted = `${sunday.getDate()} ${sunday.toLocaleDateString('fr-FR', { month: 'long' })}`;
    const dateRangeOnly = `${startFormatted} au ${endFormatted}`;
    const weekLabel = `Semaine du ${dateRangeOnly}`;

    const daysWithDates = WEEK_DAY_NAMES.map((dayName, idx) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + idx);
        const dateNumber = date.getDate();
        const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
        const isoDate = formatLocalDateToIso(date);
        const isToday = isoDate === todayIso;

        return {
            dayName,
            dateNumber,
            monthName,
            isoDate,
            formattedHeader: `${dayName} ${dateNumber} ${monthName}`,
            isToday
        };
    });

    return { 
        start: monday, 
        end: sunday, 
        weekLabel, 
        dateRangeOnly,
        startIso,
        endIso,
        mondayDate: monday,
        daysWithDates
    };
}

/**
 * Computes the integer week offset (e.g. -1, 0, 1, 2) of any date relative to today's week in Paris timezone.
 */
export function getWeekOffsetForDate(target: Date | string): number {
    const todayParis = getParisDateTimeInfo(new Date());
    const [curYear, curMonth, curDay] = todayParis.isoDate.split('-').map(Number);
    const currentMonday = new Date(curYear, curMonth - 1, curDay);
    const curDayOfWeek = currentMonday.getDay();
    const curDistToMonday = (curDayOfWeek + 6) % 7;
    currentMonday.setDate(currentMonday.getDate() - curDistToMonday);
    currentMonday.setHours(0, 0, 0, 0);

    const targetParis = getParisDateTimeInfo(target);
    const [tYear, tMonth, tDay] = targetParis.isoDate.split('-').map(Number);
    const targetMonday = new Date(tYear, tMonth - 1, tDay);
    const tDayOfWeek = targetMonday.getDay();
    const tDistToMonday = (tDayOfWeek + 6) % 7;
    targetMonday.setDate(targetMonday.getDate() - tDistToMonday);
    targetMonday.setHours(0, 0, 0, 0);

    const diffDays = Math.round((targetMonday.getTime() - currentMonday.getTime()) / (1000 * 60 * 60 * 24));
    return Math.round(diffDays / 7);
}

/**
 * Monday "YYYY-MM-DD" of the current week in Paris.
 */
export function getCurrentWeekStart(): string {
    return getWeekBounds(0).startIso;
}

/**
 * Week bounds and label for a given Monday "YYYY-MM-DD".
 */
export function getWeekBoundsForStart(weekStartIso: string) {
    return getWeekBounds(getWeekOffsetForDate(weekStartIso));
}

/**
 * True if the string is a real calendar date "YYYY-MM-DD" that falls on a Monday.
 */
export function isMondayIso(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [y, m, d] = value.split('-').map(n => parseInt(n, 10));
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d && date.getUTCDay() === 1;
}

/**
 * Monday "YYYY-MM-DD" (Paris) of the week containing the given date.
 */
export function getWeekStartForDate(dateIso: string): string {
    return getWeekBounds(getWeekOffsetForDate(dateIso)).startIso;
}
