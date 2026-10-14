// Inline stroke icons, drawn at 24×24 and scaled. Inline SVG rather than an icon font or image
// files: nothing to load across the shadow boundary, and `currentColor` lets CSS tint them. Shapes
// follow the Canvas Assistant Figma file — round-capped outlines, and the assistant's four-point
// sparkle with its small companion dot.

const PATHS = {
    chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    back: <path d="M19 12H5M12 19l-7-7 7-7" />,
    chevron: <path d="M9 6l6 6-6 6" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    arrowUpRight: <path d="M7 17L17 7M7 7h10v10" />,
    grades: <path d="M3 3v16a2 2 0 0 0 2 2h16M17 17V9M12 17V5M7 17v-3" />,
    calendar: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01M16 17.5h.01" />
        </>
    ),
    help: (
        <>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3.5" />
            <path d="M5.6 5.6l3.9 3.9M14.5 9.5l3.9-3.9M14.5 14.5l3.9 3.9M9.5 14.5l-3.9 3.9" />
        </>
    ),
    book: <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />,
    doc: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8M8 9h2" />,
    pulse: <path d="M22 12h-3l-3 9-6-18-3 9H2" />,
    external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
    sparkle: <path d="M12 2.5l1.2 6.3a3.4 3.4 0 0 0 2.7 2.7l6.3 1.2-6.3 1.2a3.4 3.4 0 0 0-2.7 2.7L12 22.9l-1.2-6.3a3.4 3.4 0 0 0-2.7-2.7L1.8 12.7l6.3-1.2a3.4 3.4 0 0 0 2.7-2.7zM2.4 21.6h.01" />,
    compose: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z" />,
    expand: <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />,
    shrink: <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />,
    check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
    send: <path d="M12 19V5M5 12l7-7 7 7" />,
    upload: <path d="M12 15V4M7 9l5-5 5 5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />,
    alert: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5M12 16h.01" />
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
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            {PATHS[name]}
        </svg>
    );
}
