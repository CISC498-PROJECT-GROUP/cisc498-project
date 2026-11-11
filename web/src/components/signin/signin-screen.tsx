// The sign-in screen: the site has no account of its own, so the student signs in with their UD
// account and the backend opens Canvas, Stellic and WebReg on it. One centered card, one screen per
// step of the sign-in (LoginStatus.step): the form, "working", and UD's 2FA step — finished in UD's
// own window, never here. A failure lands back on the form with the reason above it.

import type { ComponentChildren } from 'preact';
import { Icon } from '@/components/common/icon';
import { SignInForm } from '@/components/signin/signin-form';
import { Spinner } from '@/components/signin/spinner';
import { VerifyStep } from '@/components/signin/verify-step';
import type { SessionState } from '@/services/hooks/use-session';

function Frame({ children }: { children: ComponentChildren }) {
    return (
        <div class="ca-signin">
            <main class="ca-signin-card" aria-live="polite">
                <div class="ca-signin-brand">
                    <span class="ca-mark ca-mark--lg" aria-hidden="true">
                        <Icon name="sparkle" size={20} />
                    </span>
                    <span class="ca-signin-name">Canvas Assistant</span>
                </div>
                {children}
            </main>
            <p class="ca-signin-foot">
                <span>Canvas</span>
                <span class="ca-signin-dot" aria-hidden="true" />
                <span>Stellic</span>
                <span class="ca-signin-dot" aria-hidden="true" />
                <span>WebReg</span>
                <span class="ca-signin-foot-school">for the University of Delaware</span>
            </p>
        </div>
    );
}

export function SignInScreen({ session }: { session: SessionState }) {
    const { status } = session;
    return (
        <Frame>
            {status === null && <Spinner label="Checking your session…" />}
            {status?.step === 'working' && <Spinner label={status.message || 'Signing you in…'} sub="UD's sign-in opens Canvas, Stellic and WebReg for you. UD will send you a 2FA code — a UD window opens for you to enter it." />}
            {status?.step === 'verify' && <VerifyStep status={status} session={session} />}
            {(status?.step === 'failed' || status?.step === 'signed-in') && <SignInForm session={session} />}
        </Frame>
    );
}
