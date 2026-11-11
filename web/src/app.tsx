// The site root: the sign-in screen until the student's UD session is ready, then the app shell.
// The chat conversation lives HERE, above the router, so it survives moving between pages — ask
// on Home, look at Deadlines, come back to the Assistant and the thread is still there.

import { useCallback } from 'preact/hooks';
import { Shell } from '@/components/shell/shell';
import { SignInScreen } from '@/components/signin/signin-screen';
import { useChat } from '@/services/hooks/use-chat';
import { useRoute } from '@/services/hooks/use-route';
import { useSession } from '@/services/hooks/use-session';

export function App() {
    const session = useSession();
    const chat = useChat();
    const { route, navigate } = useRoute();

    const ask = useCallback(
        (question: string) => {
            navigate('assistant');
            chat.send(question);
        },
        [chat.send],
    );

    if (session.status?.step !== 'signed-in') return <SignInScreen session={session} />;
    return <Shell route={route} status={session.status} chat={chat} onAsk={ask} onSignOut={session.signOut} signingOut={session.sending} />;
}
