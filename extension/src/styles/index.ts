// Every stylesheet the widget uses, joined into the one <style> the content script puts in its
// shadow root. Order matters only in that tokens come first.

import chat from './chat.css' with { type: 'text' };
import composer from './composer.css' with { type: 'text' };
import feedback from './feedback.css' with { type: 'text' };
import grades from './grades.css' with { type: 'text' };
import home from './home.css' with { type: 'text' };
import lists from './lists.css' with { type: 'text' };
import markdown from './markdown.css' with { type: 'text' };
import shell from './shell.css' with { type: 'text' };
import submit from './submit.css' with { type: 'text' };
import tokens from './tokens.css' with { type: 'text' };

export const WIDGET_CSS = [tokens, shell, home, chat, composer, markdown, lists, grades, submit, feedback].join('\n');
