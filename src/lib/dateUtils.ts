/**
 * Date utility functions for weekly planning and calendar views.
 * Pure JavaScript - Safe for both Client and Server components.
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
 * Calculates start and end dates for the target week (Monday to Friday / Sunday).
 * offsetWeeks = 0 for current week, 1 for next week.
 */
export function getWeekBounds(offsetWeeks = 0): { 
    start: Date; 
    end: Date; 
    weekLabel: string; 
    mondayDate: Date;
    daysWithDates: {
        dayName: string;
        dateNumber: number;
        monthName: string;
        isoDate: string;
        formattedHeader: string;
    }[];
} {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = (dayOfWeek + 6) % 7;

    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday + (offsetWeeks * 7));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const startFormatted = `${monday.getDate()} ${monday.toLocaleDateString('fr-FR', { month: 'short' })}`;
    const endFormatted = `${sunday.getDate()} ${sunday.toLocaleDateString('fr-FR', { month: 'short' })}`;
    const weekLabel = `Semaine du ${startFormatted} au ${endFormatted}`;

    const daysWithDates = WEEK_DAY_NAMES.map((dayName, idx) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + idx);
        const dateNumber = date.getDate();
        const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
        const isoDate = formatLocalDateToIso(date);
        return {
            dayName,
            dateNumber,
            monthName,
            isoDate,
            formattedHeader: `${dayName} ${dateNumber} ${monthName}`
        };
    });

    return { 
        start: monday, 
        end: sunday, 
        weekLabel, 
        mondayDate: monday,
        daysWithDates
    };
}
