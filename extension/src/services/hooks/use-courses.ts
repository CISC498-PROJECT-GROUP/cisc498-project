// The student's active courses with current grades and instructors, from Canvas.

import { loadCourses } from '@/services/canvas/courses';
import { useLoad } from '@/services/hooks/use-load';
import type { Course, Loadable } from '@/services/types';

export const useCourses = (): Loadable<Course[]> => useLoad(loadCourses, []);
