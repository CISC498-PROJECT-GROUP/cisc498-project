// The weekly grid: registered sections solid, planned ones dashed and tinted, a section being given
// up struck through, the search result under the pointer as a ghost, and any block that overlaps
// another flagged as a conflict. Sections with no set time are listed under the grid. On a phone the
// grid scrolls sideways inside its card; the registered list below says the same in text.

import { Icon } from '@/components/common/icon';
import { layoutWeek, type Block, type CalendarItem } from '@/services/webreg/calendar';
import { DAY_NAMES, DAY_SHORT, formatRange, hourLabel } from '@/services/webreg/times';

const PX_PER_MIN = 0.8;

const KIND_LABEL: Record<CalendarItem['kind'], string> = { registered: 'registered', dropping: 'planned drop', planned: 'planned', preview: 'preview' };

function BlockView({ block, startHour }: { block: Block; startHour: number }) {
    const { item, meeting } = block;
    const top = (block.start - startHour * 60) * PX_PER_MIN;
    const height = Math.max(18, (block.end - block.start) * PX_PER_MIN);
    const width = 100 / block.lanes;
    const label = `${item.code}${item.title ? `, ${item.title}` : ''}, ${DAY_NAMES[block.day]} ${formatRange(meeting.start, meeting.end)}, ${KIND_LABEL[item.kind]}${block.conflict ? ', time conflict' : ''}`;
    return (
        <div
            class={`ca-cal-block ca-cal-block--${item.kind}${block.conflict ? ' ca-cal-block--conflict' : ''}`}
            style={{ top: `${top}px`, height: `${height}px`, left: `calc(${block.lane * width}% + 2px)`, width: `calc(${width}% - 4px)` }}
            role="listitem"
            aria-label={label}
            title={label}>
            <span class="ca-cal-code">
                {block.conflict && <Icon name="alert" size={11} />}
                {item.code}
            </span>
            {height >= 34 && <span class="ca-cal-time">{formatRange(meeting.start, meeting.end)}</span>}
            {height >= 52 && meeting.location && <span class="ca-cal-room">{meeting.location}</span>}
        </div>
    );
}

interface WeekCalendarProps {
    items: CalendarItem[];
}

export function WeekCalendar({ items }: WeekCalendarProps) {
    const layout = layoutWeek(items);
    const hours = Array.from({ length: layout.endHour - layout.startHour }, (_, i) => layout.startHour + i);
    const height = hours.length * 60 * PX_PER_MIN;
    const untimed = items.filter((i) => i.meetings.length === 0);
    const conflicts = layout.blocks.some((b) => b.conflict);

    return (
        <section class="ca-dash-card ca-cal-card" aria-labelledby="ca-cal-title">
            <div class="ca-dash-card-head">
                <h2 class="ca-dash-card-title" id="ca-cal-title">
                    Week at a glance
                </h2>
                <ul class="ca-cal-legend" aria-label="Legend">
                    <li class="ca-cal-key ca-cal-key--registered">Registered</li>
                    <li class="ca-cal-key ca-cal-key--planned">Planned</li>
                    <li class="ca-cal-key ca-cal-key--dropping">Dropping</li>
                    {conflicts && <li class="ca-cal-key ca-cal-key--conflict">Conflict</li>}
                </ul>
            </div>
            <div class="ca-cal-scroll" tabIndex={0} aria-label="Weekly calendar, scrolls sideways">
                <div class="ca-cal" style={{ gridTemplateColumns: `44px repeat(${layout.days.length}, minmax(96px, 1fr))` }}>
                    <div class="ca-cal-corner" />
                    {layout.days.map((d) => (
                        <div key={d} class="ca-cal-day-head">
                            <abbr title={DAY_NAMES[d]}>{DAY_SHORT[d]}</abbr>
                        </div>
                    ))}
                    <div class="ca-cal-hours" style={{ height: `${height}px` }} aria-hidden="true">
                        {hours.map((h) => (
                            <span key={h} style={{ top: `${(h - layout.startHour) * 60 * PX_PER_MIN}px` }}>
                                {hourLabel(h)}
                            </span>
                        ))}
                    </div>
                    {layout.days.map((d) => (
                        <div key={d} class="ca-cal-col" style={{ height: `${height}px`, backgroundSize: `100% ${60 * PX_PER_MIN}px` }} role="list" aria-label={DAY_NAMES[d]}>
                            {layout.blocks
                                .filter((b) => b.day === d)
                                .map((b) => (
                                    <BlockView key={b.key} block={b} startHour={layout.startHour} />
                                ))}
                        </div>
                    ))}
                </div>
            </div>
            {untimed.length > 0 && (
                <p class="ca-cal-untimed">
                    <strong>No set meeting time:</strong> {untimed.map((i) => `${i.code}${i.kind === 'registered' ? '' : ` (${KIND_LABEL[i.kind]})`}`).join(', ')}
                </p>
            )}
            {items.length === 0 && <p class="ca-empty-line">Nothing on your schedule for this term yet. Search for a course to start a plan.</p>}
        </section>
    );
}
