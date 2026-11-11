// The student's UD session: where the sign-in stands, and what the student can do about it — sign in,
// sign out. While the sign-in runs (talking to CAS, or waiting while the student enters UD's 2FA code
// in UD's own window) the status is polled about once a second.
//
// `notice` is what the sign-in screen should say: why the last attempt failed, or that the session
// ended. A fresh visitor (GET /auth/status → "failed: Not signed in") gets no notice.
//
// Anything loaded for one student is memoised for the page's lifetime (courses, the plan…), so when
// a different UD account signs in, or the student signs out, the page reloads to drop all of it —
// the chat included.

import type { LoginStatus } from '@canvas-assistant/shared';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { onSignedOut } from '@/services/api/upstream';
import { fetchStatus, isPolling, postLogin, postLogout } from '@/services/auth/auth-api';

const POLL_MS = 1000;

export interface SessionState {
    /** null until the first status check answers. */
    status: LoginStatus | null;
    notice: string | null;
    /** A request from the student (sign in, sign out) is on its way. */
    sending: boolean;
    signIn: (username: string, password: string) => void;
    signOut: () => void;
}

const message = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export function useSession(): SessionState {
    const [status, setStatus] = useState<LoginStatus | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const attempted = useRef(false);
    const signedInAs = useRef<string | null>(null);

    const accept = useCallback((next: LoginStatus) => {
        if (next.step === 'signed-in') {
            const user = next.username ?? '';
            if (signedInAs.current !== null && signedInAs.current !== user) return location.reload();
            signedInAs.current = user;
        }
        if (next.step === 'failed' && attempted.current) setNotice(next.message);
        setStatus(next);
    }, []);

    useEffect(() => {
        fetchStatus().then(accept, (error) => {
            setNotice(message(error));
            setStatus({ step: 'failed', message: message(error) });
        });
        return onSignedOut(() => {
            attempted.current = false;
            setNotice('Your UD session ended — sign in again to pick up where you left off.');
            setStatus({ step: 'failed', message: 'Signed out.' });
        });
    }, []);

    useEffect(() => {
        if (!isPolling(status)) return;
        const timer = setTimeout(() => fetchStatus().then(accept, () => setStatus({ ...status! })), POLL_MS);
        return () => clearTimeout(timer);
    }, [status]);

    const send = useCallback((request: () => Promise<LoginStatus>) => {
        attempted.current = true;
        setSending(true);
        setNotice(null);
        request()
            .then(accept, (error) => setNotice(message(error)))
            .finally(() => setSending(false));
    }, []);

    const signIn = useCallback((username: string, password: string) => send(() => postLogin(username, password)), []);
    const signOut = useCallback(() => {
        setSending(true);
        postLogout()
            .catch(() => null)
            .finally(() => {
                location.hash = '#/';
                location.reload();
            });
    }, []);

    return { status, notice, sending, signIn, signOut };
}
