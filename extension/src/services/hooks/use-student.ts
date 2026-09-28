// The signed-in student's name, for the greeting.

import { loadStudent, type Student } from '@/services/canvas/courses';
import { useLoad } from '@/services/hooks/use-load';
import type { Loadable } from '@/services/types';

export const useStudent = (): Loadable<Student | null> => useLoad(loadStudent, null);
