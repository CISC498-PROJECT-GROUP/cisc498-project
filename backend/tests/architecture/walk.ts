// File-walking helpers shared by the architecture tests.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const REPO = join(import.meta.dir, '..', '..', '..');

/** Recursively collect files under a dir matching `ext`; returns [] when the dir doesn't exist. */
export const files_under = (dir: string, ext: RegExp): string[] => {
    if (!existsSync(dir)) return [];
    const out: string[] = [];
    for (const name of readdirSync(dir)) {
        if (name === 'node_modules' || name === 'dist') continue;
        const full = join(dir, name);
        if (statSync(full).isDirectory()) out.push(...files_under(full, ext));
        else if (ext.test(name)) out.push(full);
    }
    return out;
};

export const ts_files = (dir: string): string[] => files_under(dir, /\.ts$/);

/** All static import / export-from specifiers in a file. */
export const import_specs = (file: string): string[] => [...readFileSync(file, 'utf8').matchAll(/(?:^|\n)\s*(?:import|export)\s[^;]*?from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]!);

export const rel = (file: string): string => relative(REPO, file);
