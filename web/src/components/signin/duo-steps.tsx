// Duo's waiting and choose steps. Waiting: a push (or call) is on its way to the student's phone —
// a spinner, and a fold with the other methods. Choose: one button per method Duo offered, plus
// "Try again" for a push that timed out or was denied. The passcode step is in duo-passcode.tsx.

import type { DuoMethod, LoginStatus } from '@canvas-assistant/shared';
import { useState } from 'preact/hooks';
import { Icon, type IconName } from '@/components/common/icon';
import { SignInError } from '@/components/signin/signin-error';
import { Spinner } from '@/components/signin/spinner';
import type { SessionState } from '@/services/hooks/use-session';

interface StepProps {
    status: LoginStatus;
    session: SessionState;
}

const METHODS: Record<DuoMethod, { label: string; icon: IconName; hint: string }> = {
    push: { label: 'Send me a push', icon: 'phone', hint: 'Approve it in Duo Mobile' },
    call: { label: 'Call my phone', icon: 'call', hint: 'Answer and follow the prompt' },
    passcode: { label: 'Enter a passcode', icon: 'key', hint: 'From Duo Mobile, a text or a bypass code' },
};

export function MethodButtons({ methods, session, except }: { methods: DuoMethod[]; session: SessionState; except?: DuoMethod }) {
    return (
        <div class="ca-duo-methods">
            {methods
                .filter((m) => m !== except)
                .map((m) => (
                    <button key={m} type="button" class="ca-duo-method" disabled={session.sending} onClick={() => session.answerDuo({ action: 'method', method: m })}>
                        <span class="ca-duo-method-icon" aria-hidden="true">
                            <Icon name={METHODS[m].icon} size={18} />
                        </span>
                        <span class="ca-duo-method-text">
                            <span class="ca-duo-method-label">{METHODS[m].label}</span>
                            <span class="ca-duo-method-hint">{METHODS[m].hint}</span>
                        </span>
                        <Icon name="chevron" size={16} />
                    </button>
                ))}
        </div>
    );
}

export function DuoWaiting({ status, session }: StepProps) {
    const [other, setOther] = useState(false);
    const methods = (status.methods ?? []).filter((m) => m !== 'push');
    return (
        <div class="ca-signin-step">
            <Spinner label="Approve the sign-in on your phone" sub={status.message} />
            <SignInError text={session.notice} />
            {methods.length > 0 && !other && (
                <button type="button" class="ca-link ca-signin-alt" onClick={() => setOther(true)}>
                    Use another method
                </button>
            )}
            {other && <MethodButtons methods={methods} session={session} />}
        </div>
    );
}

export function DuoChoose({ status, session }: StepProps) {
    const methods: DuoMethod[] = status.methods?.length ? status.methods : ['push', 'call', 'passcode'];
    return (
        <div class="ca-signin-step">
            <div class="ca-signin-head">
                <h1 class="ca-signin-title">Verify with Duo</h1>
                <p class="ca-signin-sub">{status.message}</p>
            </div>
            <SignInError text={session.notice} />
            <MethodButtons methods={methods} session={session} />
            <button type="button" class="ca-btn ca-btn--quiet ca-btn--block" disabled={session.sending} onClick={() => session.answerDuo({ action: 'retry' })}>
                <Icon name="refresh" size={15} />
                Try again
            </button>
        </div>
    );
}
