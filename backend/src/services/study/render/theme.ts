// The guide's colours. Each unit takes the next colour in turn — blue, teal, orange, purple, then
// pink and green for longer guides — and the overview and review pages are navy. The section writer
// is told its unit's colour so its diagrams match the page they land on.

export interface UnitTheme {
    /** Header band, section badges, table heads, walkthrough rings. */
    main: string;
    /** The pale fill of an idea callout and a tinted table row. */
    tint: string;
    /** A slightly deeper tint, for borders on tinted fills. */
    soft: string;
}

const UNITS: UnitTheme[] = [
    { main: '#3b5bdb', tint: '#edf2ff', soft: '#d0dbff' },
    { main: '#0c8a7e', tint: '#e6f6f4', soft: '#bfe6e1' },
    { main: '#d9480f', tint: '#fff3eb', soft: '#ffd8bf' },
    { main: '#7048e8', tint: '#f3f0ff', soft: '#ddd3ff' },
    { main: '#c2255c', tint: '#fff0f6', soft: '#fcc8dd' },
    { main: '#2b8a3e', tint: '#ebfbee', soft: '#c3ecca' },
];

export const NAVY: UnitTheme = { main: '#1e2a5a', tint: '#eef1f8', soft: '#d5dbea' };

export const unitTheme = (index: number): UnitTheme => UNITS[((index % UNITS.length) + UNITS.length) % UNITS.length]!;
