// The page the address bar's hash names, kept in step with back/forward and with links to #/….
// navigate() is for code that moves the student (the home composer sending a question to the
// assistant); plain <a href="#/…"> links need nothing from here.

import { useCallback, useEffect, useState } from 'preact/hooks';
import { parseRoute, routeHref, type RouteId } from '@/services/routes';

export interface RouteState {
    route: RouteId;
    navigate: (id: RouteId) => void;
}

export function useRoute(): RouteState {
    const [route, setRoute] = useState<RouteId>(() => parseRoute(location.hash));

    useEffect(() => {
        const sync = () => setRoute(parseRoute(location.hash));
        window.addEventListener('hashchange', sync);
        return () => window.removeEventListener('hashchange', sync);
    }, []);

    const navigate = useCallback((id: RouteId) => {
        location.hash = routeHref(id);
    }, []);

    return { route, navigate };
}
