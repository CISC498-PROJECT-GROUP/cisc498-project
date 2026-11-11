// Duo's passcode step: 6 to 9 digits from Duo Mobile, a text message or a bypass code. A wrong code
// comes back as this same step with Duo's message, so the field clears and the message shows.

import type { LoginStatus } from '@canvas-assistant/shared';
import { useEffect, useRef, useState } from 'preact/hooks';
import { MethodButtons } from '@/components/signin/duo-steps';
import { SignInError } from '@/components/signin/signin-error';
import { normalizePasscode } from '@/services/auth/username';
import type { SessionState } from '@/services/hooks/use-session';

export function DuoPasscode({ status, session }: { status: LoginStatus; session: SessionState }) {
    const [code, setCode] = useState('');
    const [problem, setProblem] = useState<string | null>(null);
    const [other, setOther] = useState(false);
    const box = useRef<HTMLInputElement>(null);
    const others = (status.methods ?? []).filter((m) => m !== 'passcode');

    useEffect(() => {
        setCode('');
        box.current?.focus();
    }, [status.message]);

    const submit = (event: Event) => {
        event.preventDefault();
        const digits = normalizePasscode(code);
        if (!digits) return setProblem('A Duo passcode is 6 to 9 digits.');
        setProblem(null);
        session.answerDuo({ action: 'passcode', code: digits });
    };

    return (
        <form class="ca-signin-form" onSubmit={submit} noValidate>
            <div class="ca-signin-head">
                <h1 class="ca-signin-title">Enter your Duo passcode</h1>
                <p class="ca-signin-sub">{status.message}</p>
            </div>
            <SignInError text={problem ?? session.notice} />
            <label class="ca-field-label">
                Passcode
                <input ref={box} class="ca-field ca-field--code" inputMode="numeric" autoComplete="one-time-code" maxLength={11} placeholder="••••••" value={code} disabled={session.sending} onInput={(e) => setCode(e.currentTarget.value)} />
            </label>
            <button type="submit" class="ca-btn ca-btn--primary ca-btn--block" disabled={session.sending}>
                {session.sending ? 'Checking…' : 'Verify'}
            </button>
            {!other && others.length > 0 && (
                <button type="button" class="ca-link ca-signin-alt" onClick={() => setOther(true)}>
                    Use another method
                </button>
            )}
            {other && <MethodButtons methods={others} session={session} />}
        </form>
    );
}
