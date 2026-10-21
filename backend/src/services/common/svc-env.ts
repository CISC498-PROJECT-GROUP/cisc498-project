// The environment contract. process.env is read HERE and nowhere else in the backend — every
// other module reads `app_env`. getEnvStatus() is called at boot so a misconfigured instance is
// visible in the terminal immediately rather than at the first request.
//
// Missing credentials are a WARNING, never fatal: the API must still boot and serve /health so the
// extension can tell "backend down" apart from "backend up but not configured".

import { existsSync } from 'node:fs';

export type EnvKey = 'NODE_ENV' | 'PORT' | 'HOST' | 'ANTHROPIC_API_KEY' | 'CHAT_MODEL' | 'CHAT_EFFORT' | 'STUDY_MODEL' | 'CHROME_PATH';

export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export const DEFAULT_CHAT_MODEL = 'claude-sonnet-5-5';

/** Low, not the API's default high: this is interactive chat over tool results, where the wait is
    felt on every question and most answers are look-ups rather than hard reasoning. On Sonnet 5.5,
    low skips thinking on simple questions and still thinks when a lookup needs it; set
    CHAT_EFFORT=medium if answers that need several lookups come back thin. */
export const DEFAULT_CHAT_EFFORT: Effort = 'low';

/** The study pipeline (lecture digests, study guides) writes long, structured documents a student
    studies from, where quality matters more than the wait — so it gets the most capable model. */
export const DEFAULT_STUDY_MODEL = 'claude-opus-5-5';

const EFFORTS: readonly Effort[] = ['low', 'medium', 'high', 'xhigh', 'max'];

const read = (key: EnvKey, fallback = ''): string => (process.env[key] ?? fallback).trim();

export interface AppEnv {
    node_env: string;
    port: number;
    /** 127.0.0.1 by default: this API spends the key in ANTHROPIC_API_KEY for whoever reaches it, so
        it must not answer the LAN. */
    host: string;
    anthropic_api_key: string;
    chat_model: string;
    chat_effort: Effort;
    study_model: string;
    /** The Chrome/Chromium that prints study PDFs. '' means look in the usual install places. */
    chrome_path: string;
}

const effort = (): Effort => {
    const value = read('CHAT_EFFORT', DEFAULT_CHAT_EFFORT).toLowerCase();
    return (EFFORTS as readonly string[]).includes(value) ? (value as Effort) : DEFAULT_CHAT_EFFORT;
};

export const app_env: AppEnv = {
    node_env: read('NODE_ENV', 'development'),
    port: Number(read('PORT', '3010')) || 3010,
    host: read('HOST', '127.0.0.1') || '127.0.0.1',
    anthropic_api_key: read('ANTHROPIC_API_KEY'),
    chat_model: read('CHAT_MODEL', DEFAULT_CHAT_MODEL) || DEFAULT_CHAT_MODEL,
    chat_effort: effort(),
    study_model: read('STUDY_MODEL', DEFAULT_STUDY_MODEL) || DEFAULT_STUDY_MODEL,
    chrome_path: read('CHROME_PATH'),
};

export const ANTHROPIC_KEY_HINT = 'Set ANTHROPIC_API_KEY in backend/.env';

export const chatConfigured = (): boolean => app_env.anthropic_api_key !== '';

export interface EnvStatus {
    ok: boolean;
    missing: EnvKey[];
    warnings: string[];
}

/** Fatal problems land in `missing` (which clears `ok`); soft problems land in `warnings` and the
    process still boots. Nothing is fatal — without a key, /chat answers 503 and /health says so. */
export function getEnvStatus(): EnvStatus {
    const missing: EnvKey[] = [];
    const warnings: string[] = [];
    if (!chatConfigured()) warnings.push(`ANTHROPIC_API_KEY is unset — POST /chat/turn will answer 503. ${ANTHROPIC_KEY_HINT}.`);
    if (read('CHAT_EFFORT') !== '' && read('CHAT_EFFORT').toLowerCase() !== app_env.chat_effort) warnings.push(`CHAT_EFFORT "${read('CHAT_EFFORT')}" is not one of ${EFFORTS.join('/')} — using ${app_env.chat_effort}.`);
    if (app_env.chrome_path !== '' && !existsSync(app_env.chrome_path)) warnings.push(`CHROME_PATH "${app_env.chrome_path}" does not exist — POST /study/render will answer 503.`);
    return { ok: missing.length === 0, missing, warnings };
}
