// The loading and error states every data view shows before (or instead of) its content.

import type { Loadable } from '@/services/types';

interface LoadStateProps {
    state: Loadable<unknown>;
    label: string;
}

/** Renders the loading or error line, or nothing once data is in. */
export function LoadState({ state, label }: LoadStateProps) {
    if (state.loading) return <p class="ca-empty">Loading {label}…</p>;
    if (state.error)
        return (
            <p class="ca-empty ca-empty--error" role="alert">
                {state.error}
            </p>
        );
    return null;
}
