import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { import_specs, rel, ts_files } from './walk';

// The layered architecture: routes → services. There is no database yet, so there is no
// repositories layer yet either; when one arrives it sits below services and gets its own rules.
//
// Routes stay thin and see no business logic; feature services never see Hono; process.env is read
// only by svc-env. This test is the enforcement — CLAUDE.md and docs/backend-conventions.html are
// the prose.

const SRC = join(import.meta.dir, '..', '..', 'src');

/** Feature-service files: everything under src/services/ except the shared infra dirs. */
const INFRA_DIRS = new Set(['common', 'middleware']);
const feature_service_files = (): string[] => {
    const base = join(SRC, 'services');
    if (!existsSync(base)) return [];
    return readdirSync(base)
        .filter((name) => statSync(join(base, name)).isDirectory() && !INFRA_DIRS.has(name))
        .flatMap((name) => ts_files(join(base, name)));
};

describe('layered architecture', () => {
    it('src/api does not exist — all backend code lives in the layer dirs', () => {
        expect(existsSync(join(SRC, 'api')), 'src/api/ is not a layer — new code goes in routes/services').toBe(false);
    });

    it('every router lives in a module folder — no naked files at src/routes/', () => {
        const naked = readdirSync(join(SRC, 'routes')).filter((name) => name.endsWith('.ts'));
        expect(naked, `src/routes/<module>/ — move these into the folder named after their module:\n${naked.join('\n')}`).toEqual([]);
    });

    it('feature services never import hono', () => {
        const bad = feature_service_files().flatMap((file) =>
            import_specs(file)
                .filter((spec) => spec === 'hono' || spec.startsWith('hono/'))
                .map((spec) => `${rel(file)} → ${spec}`),
        );
        expect(bad, `services/<feature>/ must never see Hono — Context helpers live in routes/<module>/common.ts:\n${bad.join('\n')}`).toEqual([]);
    });

    it('process.env is read only in svc-env.ts', () => {
        const bad = ts_files(SRC)
            .filter((file) => !file.endsWith('svc-env.ts'))
            .filter((file) => /process\.env/.test(readFileSync(file, 'utf8')))
            .map(rel);
        expect(bad, `read env through app_env:\n${bad.join('\n')}`).toEqual([]);
    });
});
