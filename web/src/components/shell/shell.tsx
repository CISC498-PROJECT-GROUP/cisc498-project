// The signed-in layout: the nav (a sidebar on a wide screen, a bar along the bottom on a phone), the
// top bar, and the current page. On a page change, focus moves to the page and the window scrolls
// back to the top, so a keyboard or screen-reader user lands on the new content, not in the nav.

import type { LoginStatus } from '@canvas-assistant/shared';
import { useEffect, useRef } from 'preact/hooks';
import { Nav } from '@/components/shell/nav';
import { Page } from '@/components/shell/page';
import { TopBar } from '@/components/shell/top-bar';
import type { ChatState } from '@/services/hooks/use-chat';
import type { RouteId } from '@/services/routes';

interface ShellProps {
    route: RouteId;
    status: LoginStatus;
    chat: ChatState;
    onAsk: (question: string) => void;
    onSignOut: () => void;
    signingOut: boolean;
}

export function Shell({ route, status, chat, onAsk, onSignOut, signingOut }: ShellProps) {
    const main = useRef<HTMLElement>(null);
    const first = useRef(true);

    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        window.scrollTo(0, 0);
        main.current?.focus({ preventScroll: true });
    }, [route]);

    return (
        <div class={`ca-shell ca-shell--${route}`}>
            <a class="ca-skip" href="#ca-main" onClick={(e) => (e.preventDefault(), main.current?.focus())}>
                Skip to content
            </a>
            <Nav route={route} busy={chat.pending} />
            <div class="ca-shell-main">
                <TopBar status={status} onSignOut={onSignOut} signingOut={signingOut} />
                <main id="ca-main" ref={main} tabIndex={-1} class="ca-main">
                    <Page key={route} route={route} chat={chat} onAsk={onAsk} />
                </main>
            </div>
        </div>
    );
}
