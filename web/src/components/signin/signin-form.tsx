// UD username and password. The username field takes "jdoe" or "jdoe@udel.edu" (normalizeUsername
// keeps the part CAS wants). The note under the button says plainly what happens to the password.

import { useState } from 'preact/hooks';
import { Icon } from '@/components/common/icon';
import { SignInError } from '@/components/signin/signin-error';
import { normalizeUsername } from '@/services/auth/username';
import type { SessionState } from '@/services/hooks/use-session';

export function SignInForm({ session }: { session: SessionState }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [problem, setProblem] = useState<string | null>(null);

    const submit = (event: Event) => {
        event.preventDefault();
        const user = normalizeUsername(username);
        if (!user) return setProblem('Enter your UD username — the part of your email before @udel.edu.');
        if (password === '') return setProblem('Enter your UD password.');
        setProblem(null);
        session.signIn(user, password);
    };

    return (
        <form class="ca-signin-form" onSubmit={submit} noValidate>
            <div class="ca-signin-head">
                <h1 class="ca-signin-title">Sign in with your UD account</h1>
                <p class="ca-signin-sub">Your classes, your degree and your schedule in one place — with an assistant that reads them.</p>
            </div>
            <SignInError text={problem ?? session.notice} />
            <label class="ca-field-label">
                UD username
                <input
                    class="ca-field"
                    name="username"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellcheck={false}
                    placeholder="jdoe or jdoe@udel.edu"
                    value={username}
                    disabled={session.sending}
                    onInput={(e) => setUsername(e.currentTarget.value)}
                />
            </label>
            <label class="ca-field-label">
                Password
                <input class="ca-field" name="password" type="password" autoComplete="current-password" value={password} disabled={session.sending} onInput={(e) => setPassword(e.currentTarget.value)} />
            </label>
            <button type="submit" class="ca-btn ca-btn--primary ca-btn--block" disabled={session.sending}>
                {session.sending ? 'Signing in…' : 'Sign in'}
                {!session.sending && <Icon name="arrow" size={16} />}
            </button>
            <p class="ca-signin-note">
                <Icon name="lock" size={14} />
                <span>Your password goes to UD's sign-in once and is never stored; the site keeps your UD session only while you use it.</span>
            </p>
        </form>
    );
}
