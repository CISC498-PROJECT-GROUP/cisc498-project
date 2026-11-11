// The Degree page's two headline figures: cumulative GPA, and credits toward the degree as one bar
// (earned, in progress, planned, to go) — both Stellic's — with when Stellic last ran the audit.

import { CreditBar } from '@/components/dashboard/credit-bar';
import { creditProgram } from '@/services/stellic/audit';
import type { Loadable } from '@/services/types';
import type { DegreeAudit } from '@/services/types/stellic';

const Pending = () => <span class="ca-skel ca-stat-skel" aria-label="Loading" />;

const computed = (iso: string | null): string | null => {
    const date = iso ? new Date(iso) : null;
    return date && !Number.isNaN(date.getTime()) ? `Audit run ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : null;
};

export function DegreeSummary({ audit }: { audit: Loadable<DegreeAudit | null> }) {
    const data = audit.data;
    const credits = data ? creditProgram(data) : null;
    return (
        <div class="ca-stats ca-stats--two">
            <div class="ca-stat">
                <span class="ca-stat-label">Cumulative GPA</span>
                <span class="ca-stat-value">{audit.loading ? <Pending /> : data?.gpa != null ? data.gpa.toFixed(2) : '—'}</span>
                <span class="ca-stat-note">{computed(data?.computedAt ?? null) ?? 'from Stellic'}</span>
            </div>
            <div class="ca-stat ca-stat--wide">
                <span class="ca-stat-label">Credits toward your degree</span>
                {audit.loading ? <Pending /> : credits ? <CreditBar credits={credits.credits} /> : <span class="ca-stat-value">—</span>}
            </div>
        </div>
    );
}
