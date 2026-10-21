// Which recordings a date range takes. Pure, so tools and tests share it without the network.

import type { LectureRef } from '@canvas-assistant/shared';

/** The lectures recorded between two days (YYYY-MM-DD), inclusive. An undated recording is in no range. */
export const inRange = (lectures: LectureRef[], from: string, to: string): LectureRef[] => lectures.filter((l) => l.date !== '' && l.date >= from && l.date <= to);
