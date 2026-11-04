// The planner feed mixes work with things that are only dated: an announcement or a calendar event
// has a date but nothing to hand in, so Canvas reports no submission for it — and an undated "not
// submitted" reads as overdue. The dashboard counts and lists work only.

import type { Deadline } from '@/services/types';

const NOT_WORK = new Set(['announcement', 'calendar_event']);

export const isWork = (d: Deadline): boolean => !NOT_WORK.has(d.kind);
