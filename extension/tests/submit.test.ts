import { describe, expect, it } from 'bun:test';
import { checkSubmission, mapSubmitTarget, textToHtml } from '@/services/canvas/submit';

// What the submit view offers for an assignment, and what it refuses to send before Canvas sees it.

(globalThis as { location?: unknown }).location ??= { origin: 'https://canvas.example.edu' };

const file = (name: string) => new File(['x'], name);

describe('mapSubmitTarget', () => {
    it('keeps only the submission types the widget can send', () => {
        const t = mapSubmitTarget('7', { id: 42, name: 'HW 6', submission_types: ['online_upload', 'media_recording', 'online_text_entry'], allowed_extensions: ['.PDF', 'docx'], html_url: '/courses/7/assignments/42' });
        expect(t.kinds).toEqual(['online_text_entry', 'online_upload']);
        expect(t.extensions).toEqual(['pdf', 'docx']);
        expect(t.canvasOnly).toBe(false);
        expect(t.blocked).toBeNull();
        expect(t.url).toBe('https://canvas.example.edu/courses/7/assignments/42');
    });

    it('tells a Canvas-only assignment apart from one with nothing to turn in', () => {
        expect(mapSubmitTarget('7', { id: 1, submission_types: ['online_quiz'] }).canvasOnly).toBe(true);
        expect(mapSubmitTarget('7', { id: 1, submission_types: ['on_paper'] }).canvasOnly).toBe(false);
    });

    it('blocks a locked assignment, and one out of attempts', () => {
        expect(mapSubmitTarget('7', { id: 1, submission_types: ['online_url'], locked_for_user: true, lock_explanation: '<p>Locked until Oct 1.</p>' }).blocked).toBe('Locked until Oct 1.');
        expect(mapSubmitTarget('7', { id: 1, submission_types: ['online_url'], allowed_attempts: 2, submission: { attempt: 2 } }).blocked).toContain('all 2 attempts');
        expect(mapSubmitTarget('7', { id: 1, submission_types: ['online_url'], allowed_attempts: -1, submission: { attempt: 9 } }).blocked).toBeNull();
    });
});

describe('checkSubmission', () => {
    const target = mapSubmitTarget('7', { id: 42, submission_types: ['online_text_entry', 'online_url', 'online_upload'], allowed_extensions: ['pdf'] });

    it('needs some text, and a full http(s) link', () => {
        expect(checkSubmission(target, { kind: 'online_text_entry', text: '  ' })).not.toBeNull();
        expect(checkSubmission(target, { kind: 'online_text_entry', text: 'My answer' })).toBeNull();
        expect(checkSubmission(target, { kind: 'online_url', url: 'docs.google.com/x' })).not.toBeNull();
        expect(checkSubmission(target, { kind: 'online_url', url: 'javascript:alert(1)' })).not.toBeNull();
        expect(checkSubmission(target, { kind: 'online_url', url: 'https://docs.google.com/x' })).toBeNull();
    });

    it('needs a file of an accepted type', () => {
        expect(checkSubmission(target, { kind: 'online_upload', files: [] })).not.toBeNull();
        expect(checkSubmission(target, { kind: 'online_upload', files: [file('essay.PDF')] })).toBeNull();
        expect(checkSubmission(target, { kind: 'online_upload', files: [file('essay.pdf'), file('notes.txt')] })).toContain('notes.txt');
    });
});

describe('textToHtml', () => {
    it('makes paragraphs and line breaks, and escapes markup', () => {
        expect(textToHtml('First line\nsecond line\n\n<b>Bold?</b> & done')).toBe('<p>First line<br>second line</p><p>&lt;b&gt;Bold?&lt;/b&gt; &amp; done</p>');
    });
});
