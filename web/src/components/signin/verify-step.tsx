// UD's 2FA step. UD sends the student a code and asks for it on its own page; the backend brings
// that page up in a small UD window on the student's screen, and the student enters the code there.
// This screen only says so and waits — the site never asks for, sees or relays the code. "Cancel"
// abandons the sign-in (the UD window goes with it).

import { Spinner } from '@/components/signin/spinner';
import type { SessionState } from '@/services/hooks/use-session';
import type { LoginStatus } from '@canvas-assistant/shared';

export function VerifyStep({ status, session }: { status: LoginStatus; session: SessionState }) {
    return (
        <div class="ca-signin-step">
            <div class="ca-signin-head">
                <h1 class="ca-signin-title">Enter your 2FA code in the UD window</h1>
                <p class="ca-signin-sub">{status.message}</p>
            </div>
            <Spinner label="Waiting for UD…" sub="Can't see the UD window? It may be behind this one — check your taskbar." />
            <button type="button" class="ca-btn ca-btn--quiet ca-btn--block" disabled={session.sending} onClick={session.signOut}>
                Cancel sign-in
            </button>
        </div>
    );
}
