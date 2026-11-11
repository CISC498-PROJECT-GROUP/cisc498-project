// Where a term's registration stands, from WebReg's own flags and dates: open enrollment, the
// appointment period, before either, the penalty or withdraw period, or closed. `now` is passed so
// it tests without a clock. Pure.

import type { TermInfo } from '@/services/types/webreg';

export type WindowTone = 'open' | 'soon' | 'late' | 'closed';

export interface WindowStatus {
    label: string;
    detail: string | null;
    tone: WindowTone;
}

const fmt = (d: Date): string => d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export function registrationWindow(term: TermInfo, now: Date): WindowStatus {
    const { openEnrollment, addWithAppointment, endDropAdd } = term.windows;
    const until = endDropAdd && endDropAdd > now ? `Drop/add ends ${fmt(endDropAdd)}` : null;
    if (term.isOpenEnrollment) return { label: 'Open enrollment', detail: until, tone: 'open' };
    if (term.isAppointmentPeriod) return { label: 'Appointment period', detail: openEnrollment && openEnrollment > now ? `Open enrollment starts ${fmt(openEnrollment)}` : until, tone: 'open' };
    if (term.isPenaltyPeriod) return { label: 'Late registration', detail: 'Changes now may carry a fee or a W', tone: 'late' };
    if (term.isWithdrawPeriod) return { label: 'Withdraw period', detail: 'Drops now are withdrawals', tone: 'late' };
    const next = [addWithAppointment, openEnrollment].filter((d): d is Date => d !== null && d > now).sort((a, b) => a.getTime() - b.getTime())[0];
    if (next) return { label: 'Registration not open yet', detail: `${next === addWithAppointment ? 'Appointments start' : 'Open enrollment starts'} ${fmt(next)}`, tone: 'soon' };
    return { label: 'Registration closed', detail: endDropAdd ? `Drop/add ended ${fmt(endDropAdd)}` : null, tone: 'closed' };
}
