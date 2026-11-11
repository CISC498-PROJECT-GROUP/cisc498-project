// Invented computer-science courses for the stand-in WebReg — titles, sections, instructors, rooms and
// times are all made up. Covers the cases the schedule builder must handle: lectures with required
// labs, a full section with a waitlist, a full one without, and an online section with no meetings.

import { course, lab, lec, type FakeCourse } from './catalog';

export const CISC: FakeCourse[] = [
    course(
        'CISC108',
        'INTRO TO COMPUTER SCIENCE I',
        ['3'],
        'Computing and principles of programming with an emphasis on systematic program design. Topics include functional programming, data abstraction, procedural abstraction, use of control and state, recursion, testing, and object-oriented programming concepts.',
        [
            lec('CISC108010', { meets: ['MWF 9:05-9:55 Lyle Hall 210'], who: ['Priya Okafor'], cap: 120, taken: 96, labs: ['CISC108020L', 'CISC108021L', 'CISC108022L'] }),
            lec('CISC108011', { meets: ['TR 14:00-15:15 Lyle Hall 210'], who: ['Daniel Whitcombe'], cap: 120, taken: 71, labs: ['CISC108023L', 'CISC108024L'] }),
            lab('CISC108020L', { meets: ['T 8:00-9:50 Corwin Lab 031'], who: ['Priya Okafor'] }),
            lab('CISC108021L', { meets: ['W 15:35-17:25 Corwin Lab 031'], who: ['Priya Okafor'], cap: 24, taken: 24 }),
            lab('CISC108022L', { meets: ['R 12:30-14:20 Corwin Lab 031'], who: ['Priya Okafor'] }),
            lab('CISC108023L', { meets: ['M 15:35-17:25 Corwin Lab 033'], who: ['Daniel Whitcombe'] }),
            lab('CISC108024L', { meets: ['F 12:20-14:10 Corwin Lab 033'], who: ['Daniel Whitcombe'] }),
        ],
    ),
    course(
        'CISC181',
        'INTRO TO COMPUTER SCIENCE II',
        ['3'],
        'Principles of computer science illustrated and applied through programming in an object-oriented language. Programming projects illustrate computational problems, styles and issues that arise in computer systems development.',
        [
            lec('CISC181010', { meets: ['MWF 10:10-11:00 Brandt Hall 115'], who: ['Mei-Lin Strand'], cap: 90, taken: 64, labs: ['CISC181020L', 'CISC181021L'] }),
            lec('CISC181011', { meets: ['TR 9:30-10:45 Brandt Hall 115'], who: ['Tomasz Reyes'], cap: 90, taken: 58, labs: ['CISC181022L'] }),
            lab('CISC181020L', { meets: ['T 12:30-14:20 Corwin Lab 031'], who: ['Mei-Lin Strand'] }),
            lab('CISC181021L', { meets: ['W 12:20-14:10 Corwin Lab 031'], who: ['Mei-Lin Strand'] }),
            lab('CISC181022L', { meets: ['R 15:30-17:20 Corwin Lab 033'], who: ['Tomasz Reyes'] }),
        ],
    ),
    course('CISC210', 'INTRO TO SYSTEMS PROGRAMMING', ['3'], 'Principles of computer systems programming: memory, data representation, the C language, the Unix toolchain, debugging and building programs that manage their own resources.', [
        lec('CISC210010', { meets: ['MWF 11:15-12:05 Hollis Hall 202'], who: ['Hana Lindqvist'], cap: 60, taken: 41 }),
        lec('CISC210011', { meets: ['TR 17:00-18:15 Hollis Hall 202'], who: ['Omar Castellano'], cap: 60, taken: 33 }),
    ]),
    course('CISC220', 'DATA STRUCTURES', ['3'], 'Review of algorithm design, abstract data types and their implementations: lists, stacks, queues, trees, heaps, hash tables and graphs, with analysis of their running time.', [
        lec('CISC220010', { meets: ['MWF 10:10-11:00 Hollis Hall 101'], who: ['Grace Abernathy'], cap: 80, taken: 77 }),
        lec('CISC220011', { meets: ['TR 12:30-13:45 Hollis Hall 101'], who: ['Ravi Thornton'], cap: 80, taken: 52 }),
    ]),
    course('CISC275', 'INTRO TO SOFTWARE ENGINEERING', ['3'], 'Object-oriented software design and development: requirements, design patterns, testing, version control and working in teams on a semester project.', [
        lec('CISC275010', { meets: ['TR 11:00-12:15 Lyle Hall 118'], who: ['Lucia Fenwick'], cap: 70, taken: 70, waitlist: true, waiting: 6, notes: ['This section is full. A seat that opens goes to the first student on the waitlist.'] }),
        lec('CISC275011', { meets: ['MW 15:35-16:50 Lyle Hall 118'], who: ['Jonah Petrakis'], cap: 70, taken: 62 }),
    ]),
    course('CISC303', 'AUTOMATA THEORY', ['3'], 'Finite automata, regular languages, context-free grammars, pushdown automata, Turing machines and the limits of computation.', [
        lec('CISC303010', { meets: ['TR 8:00-9:15 Brandt Hall 204'], who: ['Ines Calloway'], cap: 50, taken: 31 }),
    ]),
    course('CISC320', 'INTRO TO ALGORITHMS', ['3'], 'Design and analysis of algorithms: divide and conquer, greedy methods, dynamic programming, graph algorithms, and an introduction to NP-completeness.', [
        lec('CISC320010', { meets: ['MWF 13:25-14:15 Hollis Hall 101'], who: ['Felix Marchetti'], cap: 75, taken: 49 }),
        lec('CISC320011', { meets: ['TR 15:30-16:45 Hollis Hall 101'], who: ['Sana Bhattacharya'], cap: 75, taken: 40 }),
    ]),
    course('CISC361', 'OPERATING SYSTEMS', ['3'], 'Processes, threads, scheduling, synchronization, memory management, file systems and protection, with programming projects in a teaching kernel.', [
        lec('CISC361010', { meets: ['MW 17:00-18:15 Lyle Hall 210'], who: ['Evelyn Hartwell'], cap: 45, taken: 45, notes: ['Full. This section has no waitlist.'] }),
    ]),
    course('CISC437', 'DATABASE SYSTEMS', ['3'], 'The relational model, SQL, schema design and normalization, transactions and query processing. This section is taught online with no scheduled meetings.', [
        lec('CISC437080', { who: ['Marcus Delacroix'], cap: 60, taken: 28, notes: ['Online, asynchronous. No set meeting times.'] }),
    ]),
];
