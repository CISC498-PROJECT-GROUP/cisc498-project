import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { files_under, REPO, rel } from './walk';

// Hard rule 1: every source file stays below 200 lines. Split proactively, not after. This covers
// every workspace — backend, extension and the shared package — so one test guards the whole repo.

const LIMIT = 200;
const ROOTS = ['backend/src', 'backend/tests', 'extension/src', 'extension/scripts', 'extension/tests', 'packages/shared/src'];

describe('file length', () => {
    it(`no source file reaches ${LIMIT} lines`, () => {
        const long = ROOTS.flatMap((root) => files_under(join(REPO, root), /\.(ts|tsx|css)$/))
            .map((file) => ({ file, lines: readFileSync(file, 'utf8').split('\n').length }))
            .filter(({ lines }) => lines >= LIMIT)
            .map(({ file, lines }) => `${rel(file)} (${lines})`);
        expect(long, `split these files:\n${long.join('\n')}`).toEqual([]);
    });
});
