// One dashboard section: a titled card that says where its data comes from. While its data loads
// or fails it shows LoadState in place of its body; a Stellic failure also offers the sign-in link,
// since an expired Stellic session is the usual cause.

import type { ComponentChildren } from 'preact';
import { Icon } from '@/components/common/icon';
import { LoadState } from '@/components/common/load-state';
import { STELLIC_ORIGIN } from '@/services/school';
import type { Loadable } from '@/services/types';

export type Source = 'canvas' | 'stellic' | 'both';

const SOURCE_LABEL: Record<Source, string> = { canvas: 'Canvas', stellic: 'Stellic', both: 'Canvas + Stellic' };

interface CardProps {
    title: string;
    source: Source;
    /** A short figure or note at the right of the title row. */
    aside?: ComponentChildren;
    /** Shown in place of the body until every state has loaded. */
    states?: Loadable<unknown>[];
    rows?: number;
    class?: string;
    children?: ComponentChildren;
}

export function Card({ title, source, aside, states = [], rows = 3, class: extra = '', children }: CardProps) {
    const waiting = states.find((s) => s.loading || s.error);
    const stellicDown = source !== 'canvas' && states.some((s) => s.error);
    return (
        <section class={`ca-dash-card ${extra}`} aria-label={title}>
            <header class="ca-dash-card-head">
                <h2 class="ca-dash-card-title">{title}</h2>
                <span class={`ca-source ca-source--${source}`}>{SOURCE_LABEL[source]}</span>
                {aside && <span class="ca-dash-card-aside">{aside}</span>}
            </header>
            {waiting ? <LoadState state={waiting} rows={rows} /> : children}
            {stellicDown && (
                <a class="ca-link ca-dash-signin" href={`${STELLIC_ORIGIN}/app/planner`} target="_blank" rel="noreferrer">
                    Open Stellic to sign in
                    <Icon name="external" size={12} />
                </a>
            )}
        </section>
    );
}
