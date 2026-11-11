// What the student types as their UD username, reduced to what CAS wants. Students often type their
// email ("jdoe@udel.edu") — CAS takes the part before the @. Pure, so it tests without a sign-in.

/** "  JDoe@udel.edu " → "jdoe"; null when nothing usable is left. */
export function normalizeUsername(input: string): string | null {
    const trimmed = input.trim().toLowerCase();
    const local = trimmed.includes('@') ? trimmed.slice(0, trimmed.indexOf('@')) : trimmed;
    return /^[a-z0-9._-]+$/.test(local) ? local : null;
}

/** A Duo passcode: 6–9 digits once spaces are taken out, or null. */
export function normalizePasscode(input: string): string | null {
    const digits = input.replace(/\s+/g, '');
    return /^\d{6,9}$/.test(digits) ? digits : null;
}
