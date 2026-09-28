// Inline stroke icons, drawn at 24×24 and scaled. Inline SVG rather than an icon font or image
// files: nothing to load across the shadow boundary, and `currentColor` lets CSS tint them.

const PATHS = {
    chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    back: <path d="M15 6l-6 6 6 6" />,
    chevron: <path d="M9 6l6 6-6 6" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    grades: <path d="M3 20h18M6 16v-5M11 16V6M16 16v-8" />,
    calendar: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
        </>
    ),
    help: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" />
        </>
    ),
    book: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5" />,
    pulse: <path d="M3 12h4l3-8 4 16 3-8h4" />,
    external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps {
    name: IconName;
    size?: number;
}

export function Icon({ name, size = 20 }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            {PATHS[name]}
        </svg>
    );
}
