// Schedule (#/schedule): the schedule builder. The term's registration as WebReg has it, a week
// calendar of it with the plan laid over, search to find sections, the plan (a draft in this browser)
// and the courses planned in Stellic for the term. Registering — and dropping or editing a registered
// section — always goes through the review dialog's explicit confirm.

import { useCallback, useEffect, useState } from 'preact/hooks';
import { LoadState } from '@/components/common/load-state';
import { PageHead } from '@/components/shell/page-head';
import { EditDialog } from '@/components/schedule/edit-dialog';
import { PlanPanel } from '@/components/schedule/plan-panel';
import { RegisteredList } from '@/components/schedule/registered-list';
import { ReviewDialog } from '@/components/schedule/review-dialog';
import { SearchPanel } from '@/components/schedule/search-panel';
import { StellicPanel } from '@/components/schedule/stellic-panel';
import { TermBar, TermPicker } from '@/components/schedule/term-bar';
import { WeekCalendar } from '@/components/schedule/week-calendar';
import { useWebregSchedule } from '@/services/hooks/use-webreg';
import { usePlanDraft } from '@/services/hooks/use-webreg-plan';
import { calendarItems, type CalendarItem } from '@/services/webreg/calendar';
import { findConflicts } from '@/services/webreg/conflicts';
import { creditLoad, leavingIds, pendingAdds, planSteps, replacementsFor, stepSection } from '@/services/webreg/plan';
import { plannedAddFor } from '@/services/webreg/plan-draft';
import { courseKey } from '@/services/webreg/section-id';
import type { ComponentSection, RegisteredSection, SectionInfo, WebregSchedule, WriteStep } from '@/services/types/webreg';

function Builder({ schedule, loading, onPick, onRefresh }: { schedule: WebregSchedule; loading: boolean; onPick: (strm: string) => void; onRefresh: () => void }) {
    const strm = schedule.term.strm;
    const plan = usePlanDraft(strm);
    const [query, setQuery] = useState('');
    const [preview, setPreview] = useState<Omit<CalendarItem, 'kind'> | null>(null);
    const [review, setReview] = useState<WriteStep[] | null>(null);
    const [editing, setEditing] = useState<RegisteredSection | null>(null);
    const registered = schedule.sections;

    useEffect(() => {
        plan.prune(registered.map((s) => s.id));
    }, [registered]);

    const adds = pendingAdds(plan.draft, registered);
    const leaving = leavingIds(plan.draft, registered);
    const items = calendarItems(registered, adds, leaving, preview && { ...preview, kind: 'preview' });
    const onSchedule = items.filter((i) => i.kind === 'registered' || i.kind === 'planned');
    const conflicts = findConflicts(onSchedule);
    const load = creditLoad(schedule, plan.draft);
    const steps = planSteps(plan.draft, schedule);
    const canWrite = !schedule.readOnly;
    const canAdd = canWrite && schedule.isAddPossible;

    const status = new Map<string, string>();
    for (const add of adds) status.set(courseKey(add.sections[0].course), 'In plan');
    for (const s of registered) if (!leaving.has(s.id)) status.set(courseKey(s.course), 'Registered');

    const planSection = (info: SectionInfo, components: { type: string; section: ComponentSection }[]) => plan.add(plannedAddFor(info, components, replacementsFor(info, registered)));
    const dropNow = (s: RegisteredSection) => setReview([{ kind: 'drop', sections: [stepSection(s)], withdraw: schedule.term.isWithdrawPeriod && s.withdrawable }]);
    const search = (code: string) => {
        setQuery(code);
        document.getElementById('ca-search-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <>
            <PageHead kicker="WebReg" title="Schedule builder" sub="Plan next term around what you're registered for, then register in one go." actions={<TermPicker schedule={schedule} loading={loading} onPick={onPick} />} />
            <TermBar schedule={schedule} load={load} />
            <div class={`ca-sched${loading ? ' ca-sched--loading' : ''}`}>
                <div class="ca-sched-main">
                    <WeekCalendar items={items} />
                    <RegisteredList sections={registered} plannedDrops={new Set(plan.draft.drops)} canWrite={canWrite} onToggleDrop={plan.toggleDrop} onDrop={dropNow} onEdit={setEditing} />
                </div>
                <aside class="ca-sched-side" aria-label="Plan your schedule">
                    <SearchPanel strm={strm} query={query} onQuery={setQuery} taken={onSchedule} status={status} canAdd={canAdd} onPreview={setPreview} onPlan={planSection} />
                    <PlanPanel adds={adds} drops={registered.filter((s) => plan.draft.drops.includes(s.id))} plan={plan} load={load} conflicts={conflicts} stepCount={steps.length} canWrite={canWrite} onReview={() => setReview(steps)} />
                    <StellicPanel termLabel={schedule.term.label} status={status} onSearch={search} />
                </aside>
            </div>
            {editing && (
                <EditDialog
                    strm={strm}
                    section={editing}
                    onClose={() => setEditing(null)}
                    onReview={(step) => {
                        setEditing(null);
                        setReview([step]);
                    }}
                />
            )}
            {review && <ReviewDialog strm={strm} termLabel={schedule.term.label} steps={review} registered={registered} onClose={() => setReview(null)} onFinished={onRefresh} />}
        </>
    );
}

export function SchedulePage() {
    const [strm, setStrm] = useState<string | null>(null);
    const schedule = useWebregSchedule(strm);
    const refresh = useCallback(() => schedule.retry(), [schedule.retry]);

    if (!schedule.data)
        return (
            <>
                <PageHead kicker="WebReg" title="Schedule builder" sub="Reading your registration from WebReg…" />
                <LoadState state={schedule} rows={4} />
                {schedule.error && strm !== null && (
                    <button type="button" class="ca-link" onClick={() => setStrm(null)}>
                        Open the current term instead
                    </button>
                )}
            </>
        );
    return <Builder key={schedule.data.term.strm} schedule={schedule.data} loading={schedule.loading} onPick={setStrm} onRefresh={refresh} />;
}
