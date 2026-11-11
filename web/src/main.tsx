// The site's entry. Every stylesheet goes into one <style> in <head> (styles/index.ts), then the app
// renders into #app — the sign-in screen until the student's UD session is ready, then the site.

import { render } from 'preact';
import { App } from '@/app';
import { SITE_CSS } from '@/styles';

const style = document.createElement('style');
style.textContent = SITE_CSS;
document.head.appendChild(style);

const root = document.getElementById('app')!;
root.className = 'ca-root';
render(<App />, root);
