// The one place log lines are shaped. Every line is `[tag] message key=value key=value`, which is
// the convention src/index.ts sets with "[env] …" and "[api] …" — so a whole feature's output is
// one grep away (`bun run dev | grep '\[chat\]'`).
//
// WHAT MAY NEVER BE LOGGED, anywhere, by anyone using this: an API key, a Canvas token, a student's
// question, or any prose the model produced. Counts, statuses, timings and field names describe a
// call without reproducing its content — that is the line.

/** Values a log field may hold. `undefined` fields are dropped rather than printed as "undefined". */
export type LogValue = string | number | boolean | undefined;

export type LogFields = Record<string, LogValue>;

/* Quote only when a value would otherwise break the key=value shape — an unquoted "not found"
   reads as two fields, one of which has no key. */
const render = (value: string | number | boolean): string => (typeof value === 'string' && /[\s"]/.test(value) ? JSON.stringify(value) : String(value));

const format = (tag: string, message: string, fields?: LogFields): string => {
    const pairs = Object.entries(fields ?? {})
        .filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
        .map(([key, value]) => `${key}=${render(value)}`);
    return pairs.length === 0 ? `[${tag}] ${message}` : `[${tag}] ${message} ${pairs.join(' ')}`;
};

export interface TaggedLogger {
    info(message: string, fields?: LogFields): void;
    warn(message: string, fields?: LogFields): void;
    error(message: string, fields?: LogFields): void;
}

/** `const log = createLogger('analysis')` — then every line that module writes carries the tag. */
export const createLogger = (tag: string): TaggedLogger => ({
    info: (message, fields) => console.log(format(tag, message, fields)),
    warn: (message, fields) => console.warn(format(tag, message, fields)),
    error: (message, fields) => console.error(format(tag, message, fields)),
});
