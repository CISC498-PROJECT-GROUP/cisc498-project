// One section in full, as WebReg describes it: meetings, instructors, seats and waitlist, credits and
// grading on offer, notes and the course description — and, when the lecture requires one, its labs
// to choose from (each previewable on the calendar). "Add to plan" puts it in the draft; nothing is
// registered until the student confirms the plan.

import { useState } from 'preact/hooks';
import { Icon } from '@/components/common/icon';
import type { SearchPanelProps } from '@/components/schedule/search-panel';
import { seatText } from '@/components/schedule/section-list';
import { conflictsWith } from '@/services/webreg/conflicts';
import { courseKey, sectionCode } from '@/services/webreg/section-id';
import { formatMeetings } from '@/services/webreg/times';
import type { ComponentSection, SectionInfo } from '@/services/types/webreg';

type SectionDetailProps = Pick<SearchPanelProps, 'taken' | 'status' | 'canAdd' | 'onPreview' | 'onPlan'> & { strm: string; info: SectionInfo; onBack: () => void };

export function SectionDetail({ info, taken, status, canAdd, onPreview, onPlan, onBack }: SectionDetailProps) {
    const [chosen, setChosen] = useState<Record<string, ComponentSection>>({});
    const [planned, setPlanned] = useState(false);
    const required = info.required.filter((r) => !r.optional);
    const missing = required.filter((r) => !chosen[r.type]);
    const blocked = info.full && !info.waitlistPossible;
    const clash = conflictsWith(info.meetings, taken).filter((id) => id !== info.id);
    const courseStatus = status.get(courseKey(info.course));

    const plan = () => {
        onPlan(
            info,
            Object.entries(chosen).map(([type, section]) => ({ type, section })),
        );
        setPlanned(true);
        onPreview(null);
    };

    return (
        <div class="ca-detail">
            <button type="button" class="ca-link" onClick={onBack}>
                <Icon name="back" size={13} />
                All sections
            </button>
            <div class="ca-detail-head">
                <span class="ca-search-code">{info.code}</span>
                <span class="ca-search-title">{info.title}</span>
            </div>
            <dl class="ca-detail-facts">
                <dt>When</dt>
                <dd>{formatMeetings(info.meetings)}</dd>
                <dt>Where</dt>
                <dd>
                    {info.meetings
                        .map((m) => m.location)
                        .filter(Boolean)
                        .join(' · ') || 'Not listed yet'}
                </dd>
                <dt>Instructor</dt>
                <dd>{info.instructors.join(', ') || 'Not listed'}</dd>
                <dt>Seats</dt>
                <dd class={info.full ? 'ca-seat--full' : undefined}>{seatText(info)}</dd>
                <dt>Credits</dt>
                <dd>{info.creditOptions.join(' or ') || '—'}</dd>
                <dt>Grading</dt>
                <dd>{info.gradeOptions.map((g) => g.label).join(', ') || '—'}</dd>
            </dl>
            {clash.length > 0 && (
                <p class="ca-clash">
                    <Icon name="alert" size={12} />
                    Conflicts with {clash.map(sectionCode).join(', ')}
                </p>
            )}
            {info.notes.map((n, i) => (
                <p key={i} class="ca-detail-note">
                    {n}
                </p>
            ))}
            {info.description && <p class="ca-detail-descr">{info.description}</p>}
            {required.map((r) => (
                <fieldset key={r.type} class="ca-detail-pick">
                    <legend>Choose a {r.type.toLowerCase()} (required)</legend>
                    {r.candidates.length === 0 && <p class="ca-empty-line">WebReg lists no {r.type.toLowerCase()} for this section.</p>}
                    {r.candidates.map((c) => {
                        const labClash = conflictsWith(c.meetings, taken).filter((id) => id !== c.id);
                        return (
                            <label key={c.id} class="ca-pick" onMouseEnter={() => onPreview({ id: c.id, code: c.code, title: info.title, meetings: c.meetings })} onMouseLeave={() => onPreview(null)}>
                                <input type="radio" name={`ca-pick-${info.id}-${r.type}`} checked={chosen[r.type]?.id === c.id} disabled={c.full} onChange={() => setChosen({ ...chosen, [r.type]: c })} />
                                <span class="ca-pick-text">
                                    <strong>{c.code}</strong> {formatMeetings(c.meetings)}
                                    <span class="ca-muted ca-small">
                                        {c.full ? 'Full' : c.seats.open !== null ? `${c.seats.open} open` : 'Open'}
                                        {labClash.length > 0 && ` · conflicts with ${labClash.map(sectionCode).join(', ')}`}
                                    </span>
                                </span>
                            </label>
                        );
                    })}
                </fieldset>
            ))}
            {courseStatus && (
                <p class="ca-muted ca-small">
                    {courseStatus === 'Registered' ? `You're registered in ${info.course}. Planning this section makes it a swap — your seat is kept if the new one fails.` : `${info.course} is already in your plan; this replaces it.`}
                </p>
            )}
            <button type="button" class="ca-btn ca-btn--primary ca-btn--block" disabled={!canAdd || blocked || missing.length > 0 || planned} onClick={plan}>
                {planned ? 'In your plan' : blocked ? 'Full — no waitlist' : missing.length ? `Choose a ${missing[0].type.toLowerCase()} first` : info.full ? 'Plan to join the waitlist' : 'Add to plan'}
            </button>
            {!canAdd && <p class="ca-muted ca-small">WebReg isn't taking adds for this term.</p>}
        </div>
    );
}
