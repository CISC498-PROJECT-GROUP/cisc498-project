// A ring spinner with a status line under it — the sign-in's "working" and "waiting" states.

export function Spinner({ label, sub }: { label: string; sub?: string }) {
    return (
        <div class="ca-signin-wait" role="status">
            <span class="ca-spinner" aria-hidden="true" />
            <p class="ca-signin-wait-text">{label}</p>
            {sub && <p class="ca-signin-sub">{sub}</p>}
        </div>
    );
}
