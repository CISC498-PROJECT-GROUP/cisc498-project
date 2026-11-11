// The backend's sign-in routes (backend/src/routes/auth/). The student's UD password goes to
// POST /auth/login once and the backend hands it to UD's CAS; the site never keeps it. The session
// itself is an HttpOnly cookie the site's script can't read — GET /auth/status is how it learns
// where things stand.

import type { LoginStatus } from '@canvas-assistant/shared';
import { callBackend } from '@/services/api/backend';

export const fetchStatus = (): Promise<LoginStatus> => callBackend<LoginStatus>('GET', '/auth/status', undefined, true);

export const postLogin = (username: string, password: string): Promise<LoginStatus> => callBackend<LoginStatus>('POST', '/auth/login', { username, password }, true);

export const postLogout = (): Promise<LoginStatus> => callBackend<LoginStatus>('POST', '/auth/logout', undefined, true);

/** Steps where the sign-in is still running and the site should keep asking. */
export const isPolling = (status: LoginStatus | null): boolean => status?.step === 'working' || status?.step === 'verify';
