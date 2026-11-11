// The loading and error states every data view shows before (or instead of) its content: shimmer
// placeholders shaped like the rows to come, or an error card with a retry.

import { Icon } from '@/components/common/icon';
import type { Loadable } from '@/services/types';

interface LoadStateProps {
    state: Loadable<unknown>;
    rows?: number;
}

export function LoadState({ state, rows = 3 }: LoadStateProps) {
    if (state.loading)
        return (
            <div class="ca-skeleton" aria-busy="true" aria-label="Loading">
                {Array.from({ length: rows }, (_, i) => (
                    <div key={i} class="ca-skel-row">
                        <span class="ca-skel ca-skel--dot" />
                        <span class="ca-skel-lines">
                            <span class="ca-skel" style={{ width: `${70 - i * 12}%` }} />
                            <span class="ca-skel ca-skel--thin" style={{ width: `${45 - i * 6}%` }} />
                        </span>
                    </div>
                ))}
            </div>
        );
    if (state.error)
        return (
            <div class="ca-error-card" role="alert">
                <Icon name="alert" size={18} />
                <span class="ca-error-text">{state.error}</span>
                <button type="button" class="ca-text-btn" onClick={state.retry}>
                    <Icon name="refresh" size={14} />
                    Try again
                </button>
            </div>
        );
    return null;
}
