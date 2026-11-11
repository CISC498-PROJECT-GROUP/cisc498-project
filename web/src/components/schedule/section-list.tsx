// A course's sections, each with its times, instructors and seats as WebReg reports them, and a
// warning when it clashes with something already on the schedule. Pointing at one previews it on
// the calendar; choosing it opens its detail.

import { LoadState } from '@/components/common/load-state';
import { Icon } from '@/components/common/icon';
import type { SearchPanelProps } from '@/components/schedule/search-panel';
import { useCourseSections } from '@/services/hooks/use-webreg-search';
import { conflictsWith } from '@/services/webreg/conflicts';
import { courseCode, courseKey, sectionCode } from '@/services/webreg/section-id';
import { formatMeetings } from '@/services/webreg/times';
import type { SectionInfo } from '@/services/types/webreg';

/** "12 of 40 seats open", "Full · 6 on the waitlist", "Full · no waitlist". */
export function seatText(info: Pick<SectionInfo, 'full' | 'seats' | 'waitlistPossible' | 'waitlistTotal'>): string {
    if (info.full) return info.waitlistPossible ? `Full · ${info.waitlistTotal} on the waitlist` : 'Full · no waitlist';
    if (info.seats.open !== null && info.seats.capacity !== null) return `${info.seats.open} of ${info.seats.capacity} seats open`;
    return 'Seats open';
}

type SectionListProps = Pick<SearchPanelProps, 'taken' | 'status' | 'onPreview'> & { strm: string; courseId: string; onBack: (() => void) | null; onOpen: (info: SectionInfo) => void };

export function SectionList({ strm, courseId, taken, status, onPreview, onBack, onOpen }: SectionListProps) {
    const sections = useCourseSections(strm, courseId);
    const title = sections.data[0]?.title;
    const preview = (s: SectionInfo | null) => onPreview(s && { id: s.id, code: s.code, title: s.title, meetings: s.meetings });

    return (
        <div class="ca-search-sections">
            <div class="ca-search-crumb">
                {onBack && (
                    <button type="button" class="ca-link" onClick={onBack}>
                        <Icon name="back" size={13} />
                        Courses
                    </button>
                )}
                <span class="ca-search-code">{courseCode(courseId)}</span>
                {title && <span class="ca-search-title">{title}</span>}
                {status.get(courseKey(courseId)) && <span class="ca-tag">{status.get(courseKey(courseId))}</span>}
            </div>
            {sections.loading || sections.error ? (
                <LoadState state={sections} rows={3} />
            ) : !sections.data.length ? (
                <p class="ca-empty-line">WebReg lists no sections of {courseCode(courseId)} this term.</p>
            ) : (
                <ul class="ca-search-list" onMouseLeave={() => preview(null)}>
                    {sections.data.map((s) => {
                        const clash = conflictsWith(s.meetings, taken).filter((id) => id !== s.id);
                        return (
                            <li key={s.id}>
                                <button type="button" class="ca-section-row" onClick={() => onOpen(s)} onMouseEnter={() => preview(s)} onFocus={() => preview(s)} onBlur={() => preview(null)}>
                                    <span class="ca-section-row-top">
                                        <span class="ca-search-code">{s.code}</span>
                                        <span class={`ca-seat${s.full ? ' ca-seat--full' : ''}`}>{seatText(s)}</span>
                                    </span>
                                    <span class="ca-section-row-when">{formatMeetings(s.meetings)}</span>
                                    <span class="ca-muted ca-small">{s.instructors.join(', ') || 'Instructor not listed'}</span>
                                    {clash.length > 0 && (
                                        <span class="ca-clash">
                                            <Icon name="alert" size={12} />
                                            Conflicts with {clash.map(sectionCode).join(', ')}
                                        </span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
