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
    sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z" />,
    compose: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z" />,
    expand: <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />,
    shrink: <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />,
    check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
    send: <path d="M12 19V5M5 12l7-7 7 7" />,
    upload: <path d="M12 15V4M7 9l5-5 5 5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />,
    alert: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
        </>
    ),
    refresh: <path d="M20 11a8 8 0 0 0-14.8-4M4 5v4h4M4 13a8 8 0 0 0 14.8 4M20 19v-4h-4" />,
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
