// The bar over every page: a greeting, the UD systems this session is connected to — each a link
// out to the real thing — and Sign out. Which systems are connected comes from the sign-in
// (LoginStatus.services); a system the sign-in couldn't open shows as not connected, and its pages
// say why when they try to load.

import type { LoginStatus, UdService } from '@canvas-assistant/shared';
import { Icon } from '@/components/common/icon';
import { greeting } from '@/services/format/dates';
import { useStudent } from '@/services/hooks/use-student';
import { CANVAS_ORIGIN, STELLIC_ORIGIN, WEBREG_ORIGIN } from '@/services/school';

const SERVICES: { id: UdService; label: string; href: string }[] = [
    { id: 'canvas', label: 'Canvas', href: `${CANVAS_ORIGIN}/` },
    { id: 'stellic', label: 'Stellic', href: `${STELLIC_ORIGIN}/app/planner` },
    { id: 'webreg', label: 'WebReg', href: `${WEBREG_ORIGIN}/` },
];

interface TopBarProps {
    status: LoginStatus;
    onSignOut: () => void;
    signingOut: boolean;
}

export function TopBar({ status, onSignOut, signingOut }: TopBarProps) {
    const student = useStudent();
    const first = student.data?.shortName.split(' ')[0] ?? null;

    return (
        <header class="ca-top">
            <a class="ca-top-mark ca-mark" href="#/" aria-label="Canvas Assistant — home">
                <Icon name="sparkle" size={15} />
            </a>
            <p class="ca-top-hello">
                {greeting(new Date())}
                {first ? `, ${first}` : ''}
            </p>
            <ul class="ca-top-services" aria-label="Your UD systems">
                {SERVICES.map((s) => {
                    const on = status.services?.[s.id] ?? false;
                    return (
                        <li key={s.id}>
                            <a class={`ca-service ${on ? '' : 'ca-service--off'}`} href={s.href} target="_blank" rel="noopener noreferrer" title={on ? `Connected — open ${s.label}` : `${s.label} isn't connected this session — open it`}>
                                <span class="ca-service-dot" aria-hidden="true" />
                                {s.label}
                                <span class="ca-sr-only">{on ? '(connected, opens in a new tab)' : '(not connected, opens in a new tab)'}</span>
                                <Icon name="arrowUpRight" size={12} />
                            </a>
                        </li>
                    );
                })}
            </ul>
            <div class="ca-top-user">
                {status.username && <span class="ca-top-username">{status.username}</span>}
                <button type="button" class="ca-top-signout" onClick={onSignOut} disabled={signingOut} aria-label="Sign out" title="Sign out">
                    <Icon name="logout" size={16} />
                    <span class="ca-top-signout-label">{signingOut ? 'Signing out…' : 'Sign out'}</span>
                </button>
            </div>
        </header>
    );
}
