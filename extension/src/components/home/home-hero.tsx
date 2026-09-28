// The accent header on the home screen: a time-of-day greeting and three at-a-glance numbers —
// what is due in the next 48 hours, what is overdue, how many courses — each a shortcut to the view
// that explains it.

import { Icon } from '@/components/common/icon';
import { greeting } from '@/services/format/dates';
import { glance } from '@/services/format/group-deadlines';
import { useCourses } from '@/services/hooks/use-courses';
import { useDeadlines } from '@/services/hooks/use-deadlines';
import { useStudent } from '@/services/hooks/use-student';
import type { View } from '@/services/types';

interface HomeHeroProps {
    onNavigate: (view: View) => void;
    onClose: () => void;
}

export function HomeHero({ onNavigate, onClose }: HomeHeroProps) {
    const student = useStudent();
    const deadlines = useDeadlines();
    const courses = useCourses();
    const now = new Date();
    const first = student.data?.shortName.split(' ')[0];
    const counts = glance(deadlines.data, now);
    const ready = !deadlines.loading && !deadlines.error;

    return (
        <header class="ca-hero">
            <div class="ca-hero-top">
                <span class="ca-hero-name">
                    <Icon name="sparkle" size={15} />
                    Canvas Assistant
                </span>
                <button type="button" class="ca-icon-btn ca-icon-btn--on-accent" onClick={onClose} aria-label="Close assistant" title="Close (Esc)">
                    <Icon name="close" size={18} />
                </button>
            </div>
            <h2 class="ca-hero-title">
                {greeting(now)}
                {first ? `, ${first}` : ''}.
            </h2>
            <div class="ca-glance">
                <button type="button" class="ca-stat" onClick={() => onNavigate('deadlines')}>
                    <span class="ca-stat-num">{ready ? counts.dueSoon : '–'}</span>
                    <span class="ca-stat-label">due in 48h</span>
                </button>
                <button type="button" class={`ca-stat ${ready && counts.overdue > 0 ? 'ca-stat--alert' : ''}`} onClick={() => onNavigate('deadlines')}>
                    <span class="ca-stat-num">{ready ? counts.overdue : '–'}</span>
                    <span class="ca-stat-label">overdue</span>
                </button>
                <button type="button" class="ca-stat" onClick={() => onNavigate('grades')}>
                    <span class="ca-stat-num">{courses.loading || courses.error ? '–' : courses.data.length}</span>
                    <span class="ca-stat-label">courses</span>
                </button>
            </div>
        </header>
    );
}
