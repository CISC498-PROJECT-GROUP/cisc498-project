// The assignment the submit view is turning in: what Canvas will accept for it, and whether it
// will accept anything right now.

import { fetchSubmitTarget } from '@/services/canvas/submit';
import { useLoad } from '@/services/hooks/use-load';
import type { Loadable, SubmitTarget } from '@/services/types';

export const useSubmitTarget = (courseId: string, assignmentId: string): Loadable<SubmitTarget | null> => useLoad(() => fetchSubmitTarget(courseId, assignmentId), null, `${courseId}/${assignmentId}`);
