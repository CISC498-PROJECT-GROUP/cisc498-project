// What kind of Canvas page the content script is running on. The manifest matches whole Canvas
// domains; this narrows that to the pages the assistant appears on.

/** The dashboard ("home") is the site root. Canvas also serves it at /dashboard on some installs. */
export const isDashboard = (pathname: string): boolean => pathname === '/' || pathname === '' || pathname.replace(/\/+$/, '') === '/dashboard';
