// Every stylesheet the widget uses, joined into the one <style> the content script puts in its
// shadow root. Order matters only in that tokens come first.

import attachment from './attachment.css' with { type: 'text' };
import chat from './chat.css' with { type: 'text' };
import chatEmpty from './chat-empty.css' with { type: 'text' };
import composer from './composer.css' with { type: 'text' };
import feedback from './feedback.css' with { type: 'text' };
import grades from './grades.css' with { type: 'text' };
import home from './home.css' with { type: 'text' };
import homeTools from './home-tools.css' with { type: 'text' };
import lists from './lists.css' with { type: 'text' };
import markdown from './markdown.css' with { type: 'text' };
import shell from './shell.css' with { type: 'text' };
import submit from './submit.css' with { type: 'text' };
import support from './support.css' with { type: 'text' };
import tokens from './tokens.css' with { type: 'text' };

export const WIDGET_CSS = [tokens, shell, home, homeTools, chat, chatEmpty, composer, markdown, attachment, lists, grades, support, submit, feedback].join('\n');
