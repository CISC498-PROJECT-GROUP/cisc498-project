// The page the PDF is printed from. Rendering is deterministic, so the HTML is checked directly: the
// parts of the design are there, the footer names the course and title, and text from the model or
// Canvas can never become markup.

import { describe, expect, it } from 'bun:test';
import type { StudyDocument } from '@canvas-assistant/shared';
import { renderHtml } from '@/services/study/render/document';
import { countPages, pdfFilename } from '@/services/study/study-render';

const doc = (kind: StudyDocument['kind']): StudyDocument => ({
    kind,
    course: { code: 'CISC220', name: 'Data <Structures>', instructor: 'Dr. Anita Patel' },
    range: { from: '2026-08-26', to: '2026-09-16' },
    generated: '2026-10-21',
    lectures: [{ id: '1_a', title: 'Hash Tables', date: '2026-09-09', minutes: 75 }],
    missing: [{ id: '1_b', title: 'Guest Talk', date: '2026-09-18', minutes: 45 }],
    plan: {
        title: 'Midterm\nStudy Guide',
        subtitle: 'Built from **one** lecture.',
        chips: ['Mon, Sep 21 · in class'],
        units: [{ number: '3', title: 'Hashing', tagline: 'mod · collisions', lecture_ids: ['1_a'], sections: [{ number: '3.1', title: 'Hash functions', focus: '', points: ['h(k) = k mod m'], lecture_ids: ['1_a'] }] }],
        overview: { scope: 'Up to binary search.', said: [{ when: 'Sep 16', quote: 'Trees are not on the midterm.' }], rules: ['Closed book'], priorities: [], not_tested: ['Trees'], maybe_not: '' },
        cheat: { title: 'Memorize this', subtitle: 'One page.', tables: [{ unit: '3 · Hashing', rows: [{ name: 'Load factor', value: '$n/m$' }] }], traps: ['Rehash every key'], advice: null, plan: ['Redo the walkthroughs'] },
    },
    sections: [{ number: '3.1', title: 'Hash functions', blocks: [{ type: 'said', when: 'Sep 9', quote: '<img src=x onerror=alert(1)>' }] }],
    links: [{ number: '3.1', links: [{ title: 'Hashing (Channel)', url: 'https://www.youtube.com/watch?v=abcdefgh', posted: false }] }],
});

describe('renderHtml', () => {
    it('lays out a study guide: cover, exam at a glance, units, review sheet, sources', () => {
        const html = renderHtml(doc('study_guide'));
        expect(html).toContain('<h1 class="g-title">Midterm<br>Study Guide</h1>');
        expect(html).toContain('The exam at a glance');
        expect(html).toContain('<span class="g-badge">3.1</span>');
        expect(html).toContain('Patel said (Sep 9)');
        expect(html).toContain('g-chip');
        expect(html).toContain('Memorize this');
        expect(html).toContain('Left out for lack of captions: Guest Talk (Sep 18).');
        expect(html).toContain('@bottom-left{content:"CISC220 Midterm Study Guide"');
        expect(html).toContain('counter(page) " / " counter(pages)');
    });

    it('escapes everything that came from the model or Canvas', () => {
        const html = renderHtml(doc('study_guide'));
        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
        expect(html).toContain('Data &lt;Structures&gt;');
    });

    it('lays out a topics outline without the study guide pages', () => {
        const html = renderHtml(doc('topics'));
        expect(html).not.toContain('The exam at a glance');
        expect(html).not.toContain('How to read this guide');
        expect(html).toContain('h(k) = k mod m');
        expect(html).toContain('Lectures covered');
    });
});

describe('PDF helpers', () => {
    it('counts page objects, not the page tree', () => {
        expect(countPages(new TextEncoder().encode('<< /Type /Pages /Count 2 >> << /Type /Page >> << /Type/Page >>'))).toBe(2);
    });

    it('names the file after the course and title, without characters file systems reject', () => {
        expect(pdfFilename({ ...doc('topics'), plan: { ...doc('topics').plan, title: 'Weeks 3/5:\nTopics?' } })).toBe('CISC220 Weeks 3 5 Topics.pdf');
    });
});
