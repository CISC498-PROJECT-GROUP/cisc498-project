// Invented mathematics, English and physics courses for the stand-in WebReg — every section, name,
// room and time is made up. MATH241 is one the stand-in student "took before" (WebReg's repeat-policy
// warning); MATH268 offers variable credit; PHYS207 pairs every lecture with a required lab.

import { course, lab, lec, type FakeCourse } from './catalog';

export const OTHER: FakeCourse[] = [
    course(
        'MATH210',
        'DISCRETE MATHEMATICS I',
        ['3'],
        'Elements of discrete mathematics: logic, sets, functions, relations, induction, counting and elementary graph theory.',
        [lec('MATH210010', { meets: ['TR 11:00-12:15 Ewald Hall 140'], who: ['Nadia Kowalczyk'], cap: 50, taken: 44 }), lec('MATH210011', { meets: ['MWF 8:00-8:50 Ewald Hall 140'], who: ['Peter Ansel'], cap: 50, taken: 29 })],
        { terms: ['2268', '2271', '2273'] },
    ),
    course(
        'MATH241',
        'ANALYTIC GEOMETRY & CALCULUS A',
        ['4'],
        'Functions, limits, continuity, derivatives and their applications, and an introduction to the integral.',
        [lec('MATH241010', { meets: ['MWF 9:05-9:55 Ewald Hall 205', 'R 9:30-10:20 Ewald Hall 205'], who: ['Rosa Villeneuve'], cap: 45, taken: 30 })],
        { takenBefore: true },
    ),
    course('MATH242', 'ANALYTIC GEOMETRY & CALCULUS B', ['4'], 'Techniques and applications of integration, sequences and series, polar coordinates and parametric curves.', [
        lec('MATH242010', { meets: ['MWF 12:20-13:10 Ewald Hall 205', 'T 12:30-13:20 Ewald Hall 205'], who: ['Rosa Villeneuve'], cap: 45, taken: 38 }),
        lec('MATH242011', { meets: ['MWF 14:30-15:20 Ewald Hall 112', 'R 14:00-14:50 Ewald Hall 112'], who: ['Aaron Feld'], cap: 45, taken: 21 }),
    ]),
    course('MATH268', 'PROOFS AND PROBLEM SOLVING', ['1', '2', '3'], 'Writing proofs and solving problems in a seminar setting. Variable credit: students choose one to three credit hours with the instructor.', [
        lec('MATH268010', { meets: ['F 13:25-14:15 Ewald Hall 112'], who: ['Peter Ansel'], cap: 25, taken: 9 }),
    ]),
    course('MATH349', 'ELEMENTARY LINEAR ALGEBRA', ['3'], 'Systems of linear equations, matrices, vector spaces, linear transformations, determinants, eigenvalues and eigenvectors.', [
        lec('MATH349010', { meets: ['TR 9:30-10:45 Ewald Hall 140'], who: ['Nadia Kowalczyk'], cap: 50, taken: 47 }),
        lec('MATH349011', { meets: ['MW 17:00-18:15 Ewald Hall 140'], who: ['Aaron Feld'], cap: 50, taken: 26 }),
    ]),
    course('MATH350', 'PROBABILITY THEORY AND SIMULATION METHODS', ['3'], 'Random variables, distributions, expectation, limit theorems, and Monte Carlo simulation.', [
        lec('MATH350010', { meets: ['MWF 11:15-12:05 Ewald Hall 112'], who: ['Ilse Marquardt'], cap: 40, taken: 18 }),
    ]),
    course(
        'ENGL110',
        'SEMINAR IN COMPOSITION',
        ['3'],
        'Introduction to academic writing: reading critically, building an argument from sources, and revising.',
        [lec('ENGL110010', { meets: ['MWF 8:00-8:50 Thorne Hall 07'], who: ['Clara Benedetti'], cap: 22, taken: 20 }), lec('ENGL110011', { meets: ['TR 12:30-13:45 Thorne Hall 09'], who: ['Wesley Ambrose'], cap: 22, taken: 13 })],
        { terms: ['2268', '2271', '2273'] },
    ),
    course('ENGL207', 'INTRO TO CREATIVE WRITING', ['3'], 'Workshop course in writing fiction and poetry, with readings in contemporary work.', [
        lec('ENGL207010', { meets: ['W 18:00-20:45 Thorne Hall 14'], who: ['Wesley Ambrose'], cap: 18, taken: 12 }),
    ]),
    course('ENGL312', 'WRITTEN COMMUNICATIONS IN BUSINESS', ['3'], 'Writing for organizations: memos, reports, proposals and correspondence, with attention to audience and purpose.', [
        lec('ENGL312010', { meets: ['TR 8:00-9:15 Thorne Hall 11'], who: ['June Halvorsen'], cap: 25, taken: 19 }),
        lec('ENGL312011', { meets: ['MW 14:30-15:45 Thorne Hall 11'], who: ['June Halvorsen'], cap: 25, taken: 22 }),
    ]),
    course('PHYS207', 'FUNDAMENTALS OF PHYSICS I', ['4'], 'Calculus-based mechanics: kinematics, Newton’s laws, energy, momentum, rotation and oscillations. Laboratory required.', [
        lec('PHYS207010', { meets: ['MWF 13:25-14:15 Kessler Lab 100'], who: ['Viktor Lindgren'], cap: 150, taken: 120, labs: ['PHYS207020L', 'PHYS207021L'] }),
        lab('PHYS207020L', { meets: ['T 14:00-16:50 Kessler Lab 210'], who: ['Viktor Lindgren'] }),
        lab('PHYS207021L', { meets: ['R 14:00-16:50 Kessler Lab 210'], who: ['Viktor Lindgren'] }),
    ]),
];
