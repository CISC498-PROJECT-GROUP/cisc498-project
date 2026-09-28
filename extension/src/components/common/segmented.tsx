// A two-or-three-option toggle — a radio group styled as a pill.

interface SegmentedProps<T extends string> {
    label: string;
    value: T;
    options: { value: T; label: string }[];
    onChange: (value: T) => void;
}

export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
    return (
        <div class="ca-segmented" role="radiogroup" aria-label={label}>
            {options.map((o) => (
                <button key={o.value} type="button" role="radio" aria-checked={o.value === value} class={o.value === value ? 'ca-seg ca-seg--on' : 'ca-seg'} onClick={() => onChange(o.value)}>
                    {o.label}
                </button>
            ))}
        </div>
    );
}
