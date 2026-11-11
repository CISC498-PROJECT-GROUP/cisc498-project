// Home's registration card: the term WebReg opens to (where /registration/ redirects — the one
// registration is about), where its registration window stands, the credits and courses registered
// as WebReg states them, and the way into the schedule builder.

import { Icon } from '@/components/common/icon';
import { LoadState } from '@/components/common/load-state';
import { useWebregSchedule } from '@/services/hooks/use-webreg';
import { formatMeetings } from '@/services/webreg/times';
import { registrationWindow } from '@/services/webreg/window';

export function RegistrationCard() {
    const schedule = useWebregSchedule(null);
    const data = schedule.data;
    const window = data ? registrationWindow(data.term, new Date()) : null;
    const lectures = data?.sections.filter((s) => !(s.credits === 0 && s.gradeOption === 'NON')) ?? [];

    return (
        <section class="ca-dash-card ca-reg-card" aria-labelledby="ca-reg-card-title">
            <div class="ca-dash-card-head">
                <h2 class="ca-dash-card-title" id="ca-reg-card-title">
                    {data ? `Registration · ${data.term.label}` : 'Registration'}
                </h2>
                <span class="ca-source ca-source--webreg">WebReg</span>
            </div>
            {!data ? (
                <LoadState state={schedule} rows={2} />
            ) : (
                <>
                    {window && (
                        <p class="ca-reg-card-window">
                            <span class={`ca-sched-status ca-sched-status--${window.tone}`}>{window.label}</span>
                            {window.detail && <span class="ca-muted ca-small">{window.detail}</span>}
                        </p>
                    )}
                    <p class="ca-reg-card-credits">
                        <strong>{data.totalCredits}</strong> credits registered
                        {data.maxCredits !== null && <span class="ca-muted"> of {data.maxCredits} allowed</span>}
                    </p>
                    {lectures.length === 0 ? (
                        <p class="ca-empty-line">Nothing registered for this term yet.</p>
                    ) : (
                        <ul class="ca-reg-card-list">
                            {lectures.map((s) => (
                                <li key={s.id}>
                                    <span class="ca-search-code">{s.code}</span>
                                    <span class="ca-reg-card-title">{s.title}</span>
                                    <span class="ca-muted ca-small">
                                        {formatMeetings(s.meetings)}
                                        {s.waitlisted && ` · ${s.status}`}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                    <a class="ca-btn ca-btn--quiet ca-reg-card-link" href="#/schedule">
                        Open the schedule builder
                        <Icon name="arrow" size={15} />
                    </a>
                </>
            )}
        </section>
    );
}
