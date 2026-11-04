// The dashboard page's stylesheet: the widget's tokens and shared feedback styles (skeletons, error
// card, chips), then the page's own sheets. The widget's sheet (index.ts) is not included — the page
// shares the look, not the panel's layout.

import dashCards from './dash-cards.css' with { type: 'text' };
import dashDue from './dash-due.css' with { type: 'text' };
import dashHero from './dash-hero.css' with { type: 'text' };
import dashPage from './dash-page.css' with { type: 'text' };
import dashPeople from './dash-people.css' with { type: 'text' };
import dashStellic from './dash-stellic.css' with { type: 'text' };
import dashTerm from './dash-term.css' with { type: 'text' };
import feedback from './feedback.css' with { type: 'text' };
import tokens from './tokens.css' with { type: 'text' };

export const PAGE_CSS = [tokens, feedback, dashPage, dashHero, dashCards, dashTerm, dashDue, dashStellic, dashPeople].join('\n');
