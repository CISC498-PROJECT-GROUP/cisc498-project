// One dashboard section: a titled card that says where its data comes from. While its data loads
// or fails it shows LoadState in place of its body — a failure offers a retry, nothing else: the
// backend renews a lapsed Stellic session itself, so there is nowhere to send the student.

import type { ComponentChildren } from 'preact';
import { LoadState } from '@/components/common/load-state';
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
    return (
        <section class={`ca-dash-card ${extra}`} aria-label={title}>
            <header class="ca-dash-card-head">
                <h2 class="ca-dash-card-title">{title}</h2>
                <span class={`ca-source ca-source--${source}`}>{SOURCE_LABEL[source]}</span>
                {aside && <span class="ca-dash-card-aside">{aside}</span>}
            </header>
            {waiting ? <LoadState state={waiting} rows={rows} /> : children}
        </section>
    );
}
