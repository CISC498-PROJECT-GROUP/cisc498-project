// Credits as one bar in four parts — earned, in progress, planned, still needed — with the figures
// under it. The figures are Stellic's; the bar only scales them against their sum. "Planned" is kept
// apart from "earned" because Stellic counts planned courses toward a requirement before they are
// taken.

import type { CreditSummary } from '@/services/types/stellic';

interface CreditBarProps {
    credits: CreditSummary;
    compact?: boolean;
}

const fmt = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1));

const PARTS = [
    { key: 'taken', label: 'earned', cls: 'done' },
    { key: 'inProgress', label: 'in progress', cls: 'now' },
    { key: 'planned', label: 'planned', cls: 'plan' },
    { key: 'remaining', label: 'to go', cls: 'left' },
] as const;

export function CreditBar({ credits, compact = false }: CreditBarProps) {
    const total = credits.taken + credits.inProgress + credits.planned + credits.remaining;
    const pct = (n: number) => (total > 0 ? `${(n / total) * 100}%` : '0%');
    const shown = PARTS.filter((p) => p.key === 'taken' || credits[p.key] > 0);
    const label = shown.map((p) => `${fmt(credits[p.key])} credits ${p.label}`).join(', ');
    return (
        <div class={`ca-credits ${compact ? 'ca-credits--compact' : ''}`}>
            <div class="ca-credit-bar" role="img" aria-label={label}>
                {PARTS.slice(0, 3).map((p) => (
                    <span key={p.key} class={`ca-credit-seg ca-credit-seg--${p.cls}`} style={{ width: pct(credits[p.key]) }} />
                ))}
            </div>
            <div class="ca-credit-legend" aria-hidden="true">
                {shown.map((p) => (
                    <span key={p.key}>
                        <i class={`ca-key ca-key--${p.cls}`} />
                        <b>{fmt(credits[p.key])}</b> {p.label}
                    </span>
                ))}
            </div>
        </div>
    );
}
