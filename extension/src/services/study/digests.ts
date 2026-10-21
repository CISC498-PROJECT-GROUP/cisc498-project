// Lecture digests — what each recorded lecture covered, made by the backend from its captions. A
// digest is kept for the page's lifetime, so a summary and then a study guide of the same weeks read
// each lecture once. A lecture without captions has no digest and is reported as missing.

import type { CourseRef, LectureDigest, LectureRef } from '@canvas-assistant/shared';
import { BackendError, callBackend } from '@/services/api/backend';
import { LectureError, loadTranscript } from '@/services/media/lectures';
import { mapLimit } from '@/services/study/pool';

/** The backend refuses longer; a three-hour lecture's captions are about half of it. */
const MAX_TRANSCRIPT = 400_000;

const digests = new Map<string, Promise<LectureDigest | null>>();

/** A transient failure — the server or the model hiccupped — is worth one retry; a 4xx or 503 is not. */
export const transient = (error: unknown): boolean => error instanceof BackendError && (error.status === 0 || error.status === 500);

export async function retryOnce<T>(call: () => Promise<T>): Promise<T> {
    try {
        return await call();
    } catch (error) {
        if (!transient(error)) throw error;
        return call();
    }
}

async function makeDigest(courseId: string, course: CourseRef, lecture: LectureRef): Promise<LectureDigest | null> {
    const transcript = await loadTranscript(courseId, lecture.id);
    if (transcript === null) return null;
    return retryOnce(() => callBackend<LectureDigest>('POST', '/study/digest', { course, lecture, transcript: transcript.slice(0, MAX_TRANSCRIPT) }));
}

export function digestLecture(courseId: string, course: CourseRef, lecture: LectureRef): Promise<LectureDigest | null> {
    const key = `${courseId}:${lecture.id}`;
    let made = digests.get(key);
    if (!made) {
        made = makeDigest(courseId, course, lecture).catch((error: unknown) => {
            digests.delete(key);
            throw error;
        });
        digests.set(key, made);
    }
    return made;
}

export interface DigestRun {
    digests: LectureDigest[];
    /** Lectures with no captions, or whose captions Kaltura wouldn't share. */
    missing: LectureRef[];
}

/** Digests for every lecture, three at a time, reporting progress as each finishes. */
export async function digestLectures(courseId: string, course: CourseRef, lectures: LectureRef[], progress: (label: string) => void): Promise<DigestRun> {
    let done = 0;
    progress(`Reading ${lectures.length === 1 ? 'the lecture' : `${lectures.length} lectures`}`);
    const results = await mapLimit(lectures, 3, async (lecture) => {
        try {
            return await digestLecture(courseId, course, lecture);
        } catch (error) {
            if (error instanceof LectureError) return null;
            throw error;
        } finally {
            done++;
            if (lectures.length > 1) progress(`Reading lectures — ${done} of ${lectures.length} done`);
        }
    });
    return { digests: results.filter((d): d is LectureDigest => d !== null), missing: lectures.filter((_, i) => results[i] === null) };
}
