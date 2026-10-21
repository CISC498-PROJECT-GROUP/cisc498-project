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

const pad = (n: number): string => String(n).padStart(2, '0');

/** A Date as its local calendar day, YYYY-MM-DD — the form tools take and lecture dates use. */
export const isoDay = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** "2026-10-13" → "Tue, Oct 13, 2026"; anything else comes back as it was. */
export const dayStamp = (day: string): string => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
    if (!match) return day;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

/** "Good morning" until noon, "Good afternoon" until 5 PM, then "Good evening". */
export const greeting = (now: Date): string => (now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening');

/** A day heading for grouped lists: "Today", "Tomorrow", "Yesterday", else "Thu, Oct 1". */
export const dayLabel = (date: Date, now: Date): string => {
    const days = calendarDaysUntil(date, now);
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Yesterday';
    const tile = dateTile(date);
    return `${tile.weekday}, ${tile.month} ${tile.day}`;
};

/** When something upcoming is due, as the home timeline says it: "In 5h" inside a day, otherwise
    "Thu · 11:59 PM". */
export const relativeDue = (due: Date, now: Date): string => {
    const hours = (due.getTime() - now.getTime()) / (60 * 60 * 1000);
    if (hours < 1) return 'Within the hour';
    if (hours < 24) return `In ${Math.round(hours)}h`;
    return `${WEEKDAYS[due.getDay()]} · ${formatTime(due)}`;
};

/** The span a list covers, "Sep 28 – Oct 11", counting today as the first of `days`. */
export const rangeLabel = (now: Date, days: number): string => {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days - 1);
    const short = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}`;
    return `${short(now)} – ${short(end)}`;
};
