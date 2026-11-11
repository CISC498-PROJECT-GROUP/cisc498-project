// Retry every failed source when the student comes back to the page. The usual failure on the
// dashboard is an expired Stellic session: the student follows "Open Stellic to sign in", signs in in
// another tab, and returns — and the cards reload without a click.

import { useEffect } from 'preact/hooks';
import type { Loadable } from '@/services/types';

export function useRetryOnFocus(states: Loadable<unknown>[]): void {
    useEffect(() => {
        const retryFailed = () => {
            if (document.visibilityState === 'visible') for (const s of states) if (s.error) s.retry();
        };
        window.addEventListener('focus', retryFailed);
        document.addEventListener('visibilitychange', retryFailed);
        return () => {
            window.removeEventListener('focus', retryFailed);
            document.removeEventListener('visibilitychange', retryFailed);
        };
    }, states);
}
