// The loading/error plumbing every data hook shares: run a loader once per key, expose
// { data, loading, error, retry }, and ignore a result that lands after the component has moved on.

import { useCallback, useEffect, useState } from 'preact/hooks';
import type { Loadable } from '@/services/types';

export function useLoad<T>(load: () => Promise<T>, initial: T, key: unknown = null): Loadable<T> {
    const [state, setState] = useState<Omit<Loadable<T>, 'retry'>>({ data: initial, loading: true, error: null });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let live = true;
        setState((s) => ({ ...s, loading: true, error: null }));
        load().then(
            (data) => live && setState({ data, loading: false, error: null }),
            (error: unknown) => live && setState({ data: initial, loading: false, error: error instanceof Error ? error.message : String(error) }),
        );
        return () => {
            live = false;
        };
    }, [key, attempt]);

    const retry = useCallback(() => setAttempt((n) => n + 1), []);
    return { ...state, retry };
}
