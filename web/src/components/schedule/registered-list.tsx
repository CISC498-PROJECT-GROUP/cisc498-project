// The sections WebReg has the student registered in for the term, as WebReg states them — status,
// credits, grading, meetings — with the changes they can make to each: plan a drop, drop it now, or
// change its credits or grading. "Now" still goes through the confirm dialog.

import type { RegisteredSection } from '@/services/types/webreg';
import { formatMeetings } from '@/services/webreg/times';

interface RegisteredListProps {
    sections: RegisteredSection[];
    plannedDrops: Set<string>;
    canWrite: boolean;
    onToggleDrop: (id: string) => void;
    onDrop: (section: RegisteredSection) => void;
    onEdit: (section: RegisteredSection) => void;
}

export function RegisteredList({ sections, plannedDrops, canWrite, onToggleDrop, onDrop, onEdit }: RegisteredListProps) {
    return (
        <section class="ca-dash-card ca-sched-registered" aria-labelledby="ca-reg-title">
            <div class="ca-dash-card-head">
                <h2 class="ca-dash-card-title" id="ca-reg-title">
                    Registered in WebReg
                </h2>
                <span class="ca-source ca-source--webreg">WebReg</span>
            </div>
            {sections.length === 0 ? (
                <p class="ca-empty-line">You aren't registered for anything this term.</p>
            ) : (
                <ul class="ca-reg-list">
                    {sections.map((s) => {
                        const lab = s.credits === 0 && s.gradeOption === 'NON';
                        const dropping = plannedDrops.has(s.id);
                        return (
                            <li key={s.id} class={`ca-reg-row${dropping ? ' ca-reg-row--dropping' : ''}`}>
                                <div class="ca-reg-main">
                                    <span class="ca-search-code">{s.code}</span>
                                    <span class="ca-reg-title">{s.title}</span>
                                    <span class="ca-muted ca-small">
                                        {formatMeetings(s.meetings)}
                                        {s.instructors.length > 0 && ` · ${s.instructors.join(', ')}`}
                                    </span>
                                </div>
                                <div class="ca-reg-facts">
                                    <span class={`ca-tag${s.waitlisted ? ' ca-tag--warn' : ''}`}>
                                        {s.status}
                                        {s.waitlistPosition !== null && ` #${s.waitlistPosition}`}
                                    </span>
                                    <span class="ca-small">{lab ? s.component : `${s.credits} cr · ${s.gradeLabel}`}</span>
                                </div>
                                {canWrite && (
                                    <div class="ca-reg-actions">
                                        {!lab && (
                                            <button type="button" class="ca-mini-btn" onClick={() => onEdit(s)} aria-label={`Change credits or grading for ${s.code}`}>
                                                Edit
                                            </button>
                                        )}
                                        <button type="button" class="ca-mini-btn" aria-pressed={dropping} onClick={() => onToggleDrop(s.id)} aria-label={`${dropping ? 'Keep' : 'Plan to drop'} ${s.code}`}>
                                            {dropping ? 'Keep' : 'Plan drop'}
                                        </button>
                                        <button type="button" class="ca-mini-btn ca-mini-btn--alert" onClick={() => onDrop(s)} aria-label={`Drop ${s.code} now`}>
                                            Drop…
                                        </button>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
