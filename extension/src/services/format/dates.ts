// Date formatting for deadlines. Pure functions of (due, now) so they test without a clock.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole calendar days from `now` to `due` in local time — 0 for later today, 1 for tomorrow. */
export const calendarDaysUntil = (due: Date, now: Date): number => {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    return Math.round((end.getTime() - start.getTime()) / DAY_MS);
};

/** "11:59 PM", "9:00 AM". */
export const formatTime = (date: Date): string => {
    const hours = date.getHours() % 12 || 12;
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} ${date.getHours() < 12 ? 'AM' : 'PM'}`;
};

export interface DateTile {
    month: string;
    day: string;
    weekday: string;
}

export const dateTile = (date: Date): DateTile => ({ month: MONTHS[date.getMonth()]!, day: String(date.getDate()), weekday: WEEKDAYS[date.getDay()]! });

/** A short urgency label for anything due within two days, otherwise null. */
export const dueSoonLabel = (due: Date, now: Date): string | null => {
    const days = calendarDaysUntil(due, now);
    if (days < 0 || days > 2) return null;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
};

/** "Tue, Sep 29, 2026, 11:59 PM" in the browser's time zone — how tool results state times, so the
    model never has to convert from UTC. null in, null out. */
export const localStamp = (iso: string | null | undefined): string | null => {
    if (!iso) return null;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export const timeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;
