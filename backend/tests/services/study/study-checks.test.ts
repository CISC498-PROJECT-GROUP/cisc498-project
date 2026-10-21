// The checks between the model and the page: video links must come from the search results (or the
// course's own posts), a section's quotes must be the digests', and request bodies are coerced into
// shape rather than trusted.

import { describe, expect, it } from 'bun:test';
import { foundUrls, verifyLinks, youtubeUrl } from '@/services/study/study-links';
import { groupColumns, keepVerified } from '@/services/study/study-section';
import { quoteSource } from '@/services/study/study-quotes';
import { validateDigest, validateRender } from '@/services/study/study-validate';
import { StudyRequestError } from '@/services/study/study-errors';

describe('video links', () => {
    it('reduces YouTube URLs to one canonical form and rejects the rest', () => {
        expect(youtubeUrl('https://youtu.be/abcDEF12345')).toBe('https://www.youtube.com/watch?v=abcDEF12345');
        expect(youtubeUrl('https://m.youtube.com/watch?v=abcDEF12345&t=30')).toBe('https://www.youtube.com/watch?v=abcDEF12345');
        expect(youtubeUrl('https://www.youtube.com/channel/UC123')).toBeNull();
        expect(youtubeUrl('not a url')).toBeNull();
    });

    it("collects URLs from server tool results but not from the model's own text or tool calls", () => {
        const found = foundUrls([
            { type: 'web_search_tool_result', content: [{ type: 'web_search_result', url: 'https://www.youtube.com/watch?v=found000001', title: 'x' }] },
            { type: 'text', text: 'see https://www.youtube.com/watch?v=madeup00001' },
            { type: 'tool_use', name: 'submit_links', input: { url: 'https://www.youtube.com/watch?v=madeup00002' } },
        ]);
        expect([...found]).toEqual(['https://www.youtube.com/watch?v=found000001']);
    });

    it('keeps only links that were found, or that the course posted', () => {
        const picked = {
            sections: [
                {
                    number: '1.1',
                    links: [
                        { title: 'Found', url: 'https://youtu.be/found000001', posted: false },
                        { title: 'Invented', url: 'https://www.youtube.com/watch?v=madeup00001', posted: false },
                        { title: 'Posted', url: 'https://www.youtube.com/watch?v=posted00001', posted: true },
                        { title: 'Claimed posted', url: 'https://example.com/x', posted: true },
                    ],
                },
            ],
        };
        const verified = verifyLinks(picked, new Set(['https://www.youtube.com/watch?v=found000001']), new Set(['https://www.youtube.com/watch?v=posted00001']));
        expect(verified.sections[0]!.links.map((l) => l.title)).toEqual(['Found', 'Posted']);
    });
});

describe('groupColumns', () => {
    it('pairs runs of left/right blocks into columns and turns flat blocks into typed ones', () => {
        const blocks = groupColumns([
            { type: 'callout', column: 'full', tone: '', label: 'The idea', text: 't', items: [] },
            { type: 'diagram', column: 'left', svg: '<svg viewBox="0 0 1 1"></svg>', caption: '' },
            { type: 'walkthrough', column: 'right', variant: '', label: 'W', prompt: 'p', steps: ['a'], note: '', columns: ['x'], rows: [['1']], highlight: [] },
            { type: 'text', column: 'left', text: 'alone' },
            { type: 'cards', column: 'full', cards: [{ label: 'A', text: 'a' }], items: [] },
        ]);
        expect(blocks.map((b) => b.type)).toEqual(['callout', 'columns', 'text', 'cards']);
        expect(blocks[0]).toMatchObject({ tone: 'idea' });
        expect(blocks[1]).toMatchObject({ left: [{ type: 'diagram' }], right: [{ type: 'walkthrough', variant: 'walkthrough', table: { columns: ['x'], rows: [['1']] } }] });
        expect(blocks[3]).toMatchObject({ items: [{ label: 'A', text: 'a' }] });
    });
});

describe('empty blocks', () => {
    it('folds a text block into the empty callout before it, and drops blocks with nothing to show', () => {
        const blocks = groupColumns([
            { type: 'callout', column: 'full', tone: 'idea', label: 'The idea', text: '', items: [] },
            { type: 'text', column: 'full', text: 'Loops add or multiply.' },
            { type: 'callout', column: 'full', tone: 'trap', label: 'Trap', text: ' ', items: [] },
            { type: 'list', column: 'full', items: [] },
        ]);
        expect(blocks).toEqual([{ type: 'callout', tone: 'idea', label: 'The idea', text: 'Loops add or multiply.', items: [] }]);
    });
});

describe('keepVerified', () => {
    it("drops quotes that aren't the digests', at the top level and inside columns", () => {
        const source = quoteSource('Everything up to and including binary search is on the midterm.');
        const { blocks, dropped } = keepVerified(
            [
                { type: 'said', when: 'Sep 16', quote: 'everything up to and including binary search is on the midterm' },
                { type: 'said', when: 'Sep 16', quote: 'Trees will definitely be on the midterm.' },
                { type: 'columns', left: [{ type: 'said', when: '', quote: 'Graphs are on the midterm too, I promise.' }], right: [{ type: 'text', text: 'kept' }] },
                { type: 'columns', left: [{ type: 'said', when: '', quote: 'Graphs are on the midterm too, I promise.' }], right: [] },
            ],
            source,
        );
        expect(dropped).toBe(3);
        expect(blocks.map((b) => b.type)).toEqual(['said', 'columns']);
    });
});

describe('validators', () => {
    it('needs a lecture id and a transcript', () => {
        expect(() => validateDigest({ lecture: { title: 'x' }, transcript: 'words' })).toThrow(StudyRequestError);
        expect(() => validateDigest({ lecture: { id: '1_a' }, transcript: '  ' })).toThrow(StudyRequestError);
        expect(validateDigest({ course: { code: 'C' }, lecture: { id: '1_a', date: 'Oct 7' }, transcript: 'words' }).lecture).toEqual({ id: '1_a', title: 'Untitled lecture', date: '', minutes: null });
    });

    it('coerces a document: unknown blocks and links without https are dropped', () => {
        const doc = validateRender({
            kind: 'study_guide',
            range: { from: '2026-08-26', to: '2026-10-12' },
            plan: { title: 'Guide', units: [{ number: '1', title: 'U', sections: [{ number: '1.1', title: 'S' }] }] },
            sections: [
                {
                    number: '1.1',
                    blocks: [
                        { type: 'text', text: 'ok' },
                        { type: 'iframe', src: 'x' },
                        { type: 'callout', tone: 'shout', text: 't' },
                    ],
                },
            ],
            links: [
                {
                    number: '1.1',
                    links: [
                        { title: 'a', url: 'javascript:alert(1)' },
                        { title: 'b', url: 'https://www.youtube.com/watch?v=abcdefgh' },
                    ],
                },
            ],
        });
        expect(doc.sections[0]!.blocks.map((b) => b.type)).toEqual(['text', 'callout']);
        expect(doc.sections[0]!.blocks[1]).toMatchObject({ tone: 'idea', label: '', items: [] });
        expect(doc.links[0]!.links.map((l) => l.title)).toEqual(['b']);
        expect(() => validateRender({ kind: 'study_guide', range: { from: '2026-10-12', to: '2026-08-26' }, plan: { units: [] } })).toThrow(StudyRequestError);
    });
});
