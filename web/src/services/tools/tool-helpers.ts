// Shared by the tool executors: reading the model's input safely, and shaping what goes back.

import type { ContentBlock } from '@canvas-assistant/shared';
import type { Attachment } from '@/services/types';

/** A tool result: text, or content blocks (a PDF goes back as a document block). */
export type ToolOutput = string | ContentBlock[];

/** A result that also attaches a file to the assistant's reply — a study PDF. */
export interface ToolResult {
    content: ToolOutput;
    attachment: Attachment;
}

/** What a running tool may do besides return: say what it is doing, for tools that take minutes. */
export interface ToolContext {
    progress: (label: string) => void;
}

export type ToolInput = Record<string, unknown>;

export class ToolInputError extends Error {}

/** Required string field. Ids arrive as strings or numbers depending on the model's mood. */
export const need = (input: ToolInput, key: string): string => {
    const value = input[key];
    if ((typeof value === 'string' && value.trim() !== '') || typeof value === 'number') return String(value).trim();
    throw new ToolInputError(`"${key}" is required.`);
};

export const optional = (input: ToolInput, key: string): string | undefined => {
    const value = input[key];
    return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
};

/** Required date, YYYY-MM-DD. */
export const needDay = (input: ToolInput, key: string): string => {
    const value = need(input, key);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ToolInputError(`"${key}" must be a date written YYYY-MM-DD.`);
    return value;
};

export const intIn = (input: ToolInput, key: string, fallback: number, max: number): number => {
    const value = Number(input[key]);
    return Number.isFinite(value) ? Math.min(Math.max(Math.round(value), 0), max) : fallback;
};

/** One tool result may carry at most this much text. Past it, the result says so explicitly rather
    than silently dropping content, so the model knows to narrow its request. */
export const MAX_TEXT = 40_000;

export const clip = (text: string, max = MAX_TEXT): string => (text.length <= max ? text : `${text.slice(0, max)}\n\n[Truncated: ${text.length - max} more characters not shown.]`);

/** Compact JSON with nulls and empty strings dropped — fewer tokens, same facts. */
export const toJson = (value: unknown): string => clip(JSON.stringify(value, (_key, v: unknown) => (v === null || v === '' || (Array.isArray(v) && v.length === 0) ? undefined : v)));
