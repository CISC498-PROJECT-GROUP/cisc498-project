// Every stylesheet the site uses, joined into the one <style> main.tsx puts in <head>. Order
// matters only in that tokens come first and a later sheet wins a tie: shared pieces (shell, forms,
// feedback) before the pages that build on them.
//
// One import per sheet, grouped by area; add a new sheet to both the imports and SITE_CSS.

// Base and shell
import tokens from './tokens.css' with { type: 'text' };
import shell from './shell.css' with { type: 'text' };
import nav from './nav.css' with { type: 'text' };
import shellNarrow from './shell-narrow.css' with { type: 'text' };
import topBar from './top-bar.css' with { type: 'text' };
import page from './page.css' with { type: 'text' };
import forms from './forms.css' with { type: 'text' };
import feedback from './feedback.css' with { type: 'text' };
import signin from './signin.css' with { type: 'text' };

// Home and Degree (the Canvas + Stellic cards)
import dashHero from './dash-hero.css' with { type: 'text' };
import dashCards from './dash-cards.css' with { type: 'text' };
import dashTerm from './dash-term.css' with { type: 'text' };
import dashDue from './dash-due.css' with { type: 'text' };
import dashStellic from './dash-stellic.css' with { type: 'text' };
import dashPeople from './dash-people.css' with { type: 'text' };
import home from './home.css' with { type: 'text' };
import degree from './degree.css' with { type: 'text' };

// Courses, Deadlines, Help
import grades from './grades.css' with { type: 'text' };
import lists from './lists.css' with { type: 'text' };
import submit from './submit.css' with { type: 'text' };
import support from './support.css' with { type: 'text' };

// Assistant
import chat from './chat.css' with { type: 'text' };
import chatEmpty from './chat-empty.css' with { type: 'text' };
import composer from './composer.css' with { type: 'text' };
import markdown from './markdown.css' with { type: 'text' };
import attachment from './attachment.css' with { type: 'text' };

// Schedule (the WebReg schedule builder)
import schedule from './schedule.css' with { type: 'text' };
import scheduleCalendar from './schedule-calendar.css' with { type: 'text' };
import scheduleSearch from './schedule-search.css' with { type: 'text' };
import schedulePlan from './schedule-plan.css' with { type: 'text' };
import scheduleLists from './schedule-lists.css' with { type: 'text' };
import scheduleDialog from './schedule-dialog.css' with { type: 'text' };
import scheduleConfirm from './schedule-confirm.css' with { type: 'text' };

export const SITE_CSS = [
    // Base and shell
    tokens,
    shell,
    nav,
    topBar,
    page,
    forms,
    feedback,
    signin,
    // Home and Degree
    dashHero,
    dashCards,
    dashTerm,
    dashDue,
    dashStellic,
    dashPeople,
    home,
    degree,
    // Courses, Deadlines, Help
    grades,
    lists,
    submit,
    support,
    // Assistant
    chat,
    chatEmpty,
    composer,
    markdown,
    attachment,
    // Schedule
    schedule,
    scheduleCalendar,
    scheduleSearch,
    schedulePlan,
    scheduleLists,
    scheduleDialog,
    scheduleConfirm,
    // Narrow-screen overrides last, so they win over every page's own rules.
    shellNarrow,
].join('\n');
