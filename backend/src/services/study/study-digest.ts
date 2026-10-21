// POST /study/digest: what one recorded lecture covered, from its captions. Every quote is checked
// against the transcript and dropped when it isn't there — a digest's quotes are what a study guide
// may later attribute to the instructor, so they must be the instructor's actual words.

import type { DigestRequest, LectureDigest } from '@canvas-assistant/shared';
import { createLogger } from '@/services/common/svc-log';
import { DIGEST_SCHEMA, DIGEST_SYSTEM } from '@/services/study/digest-prompt';
import { plain, structuredCall } from '@/services/study/study-model';
import { quoteFound, quoteSource } from '@/services/study/study-quotes';

const log = createLogger('study');

type DigestBody = Omit<LectureDigest, 'lecture'>;

export async function digestLecture(request: DigestRequest, signal?: AbortSignal): Promise<LectureDigest> {
    const { course, lecture, transcript } = request;
    const length = lecture.minutes ? `, ${lecture.minutes} minutes` : '';
    const heading = `Course: ${course.code} — ${course.name}\nLecture: "${lecture.title}", recorded ${lecture.date}${length}`;

    const body = await structuredCall<DigestBody>({ step: 'digest', system: DIGEST_SYSTEM, schema: DIGEST_SCHEMA, effort: 'low', signal, content: [plain(`${heading}\n\n<transcript>\n${transcript}\n</transcript>`)] });

    const source = quoteSource(transcript);
    const quotes = body.quotes.filter((quote) => quoteFound(quote.text, source));
    if (quotes.length < body.quotes.length) log.info('digest quotes dropped', { kept: quotes.length, dropped: body.quotes.length - quotes.length });

    return { lecture, ...body, quotes };
}
