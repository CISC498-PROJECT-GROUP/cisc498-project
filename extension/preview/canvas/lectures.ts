// Preview fixtures: invented lecture recordings for CISC 220 (course 101) in a stand-in Media
// Gallery, with invented captions. Lives only in the preview harness — never bundled.
//
// The captions are served as SRT, like Kaltura's machine captions; one recording has none, so the
// "left out — no captions" path runs too. Transcript text is in lecture-captions.ts.

import { CAPTIONS } from './lecture-captions';

export interface PreviewLecture {
    id: string;
    title: string;
    /** Unix seconds, as Kaltura reports createdAt. */
    createdAt: number;
    seconds: number;
    description: string;
}

const at = (day: string, hour = 11): number => Math.round(new Date(`${day}T${String(hour).padStart(2, '0')}:00:00`).getTime() / 1000);

export const GALLERY_CATEGORY = '9100101';

export const LECTURES: PreviewLecture[] = [
    { id: '1_prv0001', title: 'Course Intro and Big-O', createdAt: at('2026-08-26'), seconds: 3020, description: 'First day: how the course works, and counting work with Big-O.' },
    { id: '1_prv0002', title: 'Arrays and Linked Lists', createdAt: at('2026-08-31'), seconds: 4410, description: 'Contiguous storage versus linked nodes.' },
    { id: '1_prv0003', title: 'Stacks and Queues', createdAt: at('2026-09-02'), seconds: 4380, description: 'LIFO and FIFO, and the circular array.' },
    { id: '1_prv0004', title: 'Hash Tables', createdAt: at('2026-09-09'), seconds: 4500, description: 'Hash functions, collisions and load factor.' },
    { id: '1_prv0005', title: 'Recursion and Binary Search', createdAt: at('2026-09-14'), seconds: 4290, description: 'Recursive thinking and searching a sorted array.' },
    { id: '1_prv0006', title: 'Midterm Review', createdAt: at('2026-09-16'), seconds: 3960, description: 'What is on the midterm, and practice problems.' },
    { id: '1_prv0007', title: 'Guest Talk: Careers in Software', createdAt: at('2026-09-18'), seconds: 2700, description: 'A guest speaker; no captions were made.' },
    { id: '1_prv0008', title: 'Binary Trees', createdAt: at('2026-09-28'), seconds: 4470, description: 'Trees, traversals and binary search trees.' },
];

const stamp = (seconds: number): string => {
    const pad = (n: number, width = 2) => String(n).padStart(width, '0');
    return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)},000`;
};

/** A lecture's captions as an SRT file, one cue per sentence; null when it has none. */
export function captionSrt(id: string): string | null {
    const sentences = CAPTIONS[id];
    if (!sentences) return null;
    return sentences.map((sentence, i) => `${i + 1}\n${stamp(i * 7)} --> ${stamp(i * 7 + 6)}\n${sentence}\n`).join('\n');
}
