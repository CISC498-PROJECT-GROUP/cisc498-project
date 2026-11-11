# Canvas Assistant

A website for University of Delaware students that puts **Canvas**, **Stellic** (UD's degree planner)
and **WebReg** (registration) in one place, with an AI assistant that reads all three.

- **Home:** your GPA and degree credits, this semester's courses with grades and what's next, what's
  due, next term's registration, and a box to ask the assistant.
- **Schedule:** build next term's schedule on a week calendar. You can search classes, compare
  sections and labs, and see the courses your Stellic plan has for that term. Conflicts are flagged.
  When you're ready, you can **register, drop or swap** from the same page after reviewing every
  change.
- **Courses, Deadlines, Degree, Help:**
  - grade breakdowns for every course;
  - everything due, with a Submit button;
  - your full Stellic audit and plan;
  - where to get help.
- **Assistant:** ask about due dates, grades, policies, a syllabus buried in a PDF, recorded
  lectures (it can summarize them and build study-guide PDFs), what's left for your degree, or when
  a class meets next semester. It reads your accounts and never changes anything.

## Run it

Requires [Bun](https://bun.sh) 1.3+ and an installed Chrome, Edge or Chromium. The server uses it to
sign you in through UD's own login page.

```sh
bun install                              # once, at the repo root
cp backend/.env.example backend/.env     # then put your ANTHROPIC_API_KEY in it
bun run dev:api                          # the server, 127.0.0.1:3010
bun run dev                              # the site, http://localhost:5175
```

Open http://localhost:5175 and sign in with your UD username and password. Approve Duo on your
phone, or type a passcode into the site.

**No UD login handy, or working on registration?** `bun run preview` runs the whole site against a
stand-in UD with invented data. Any username and password works. Duo approves itself, or you can
choose a passcode and enter `123456`. Nothing reaches UD, so it's safe to add and drop there.

Before opening a PR, run what CI runs: `bun run lint && bun run test && bun run format:check`
(`bun run format` fixes formatting).

## How it works

None of Canvas, Stellic or WebReg has an API the site could use with a student's own access. So the
server signs you in the way your browser would:

1. Your username and password go into **UD's own CAS login page**, in a headless Chrome on the
   server. Duo's prompt is relayed to the site.
2. That one login opens Canvas, Stellic and WebReg through single sign-on.
3. The site's requests then go through the server, made with your sessions. The server can only
   reach those systems, and the only changes it can make are submitting your assignment and the
   registration changes you confirm.

**Your password is used once and never stored.** Your UD sessions live only in the server's memory.
They end when you sign out or after an hour idle, and a restart ends them all. Nothing you see is
logged or saved.

Stellic and WebReg have no public API. The site uses the same internal endpoints their own web pages
use, with your session. These are UD-only and experimental, and could change with any release.
Details: [`docs/stellic-integration.html`](docs/stellic-integration.html) and
[`docs/webreg-integration.html`](docs/webreg-integration.html).

## Hosting

`docker compose up -d --build` runs the server in a container, published on the host's loopback
only. Serve the site's static files (`bun run build` → `web/dist/`) from anything that also relays
`/api/*` to the server **over HTTPS**. The server holds students' live UD sessions, so it must
never be reachable except through the site.

More: [`CLAUDE.md`](CLAUDE.md) and [`docs/`](docs/).
