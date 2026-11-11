# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Canvas Assistant** — a website for University of Delaware students that puts **Canvas** (their
courses), **Stellic** (their degree plan and audit) and **WebReg** (registration) in one place, with
an AI assistant that reads all three. A student signs in once with their UD account and gets:

- **Home** — the semester at a glance: GPA and degree credits (Stellic), this term's courses joined
  across Canvas and Stellic with current grades and the next thing due, what's coming up, next
  term's registration (WebReg), and a box to ask the assistant.
- **Schedule** — a schedule builder on WebReg: the registered week on a calendar, class search,
  sections with times, seats and required labs, the courses Stellic plans for that term, conflicts
  flagged, and **registration** — add, drop, swap, change grading — after a review-and-confirm step.
- **Courses**, **Deadlines** (with submitting an assignment), **Degree** (the full Stellic audit,
  plan and advising), **Assistant** (full-page chat) and **Help**.
- **AI chat** — questions go to `backend/`, which calls Claude (`claude-sonnet-5-5`) with eighteen
  tools: twelve Canvas ones, three for recorded lectures (summaries and study PDFs from the course's
  Kaltura Media Gallery), and three for the record — the Stellic degree plan, the WebReg
  registration and WebReg class search. The **site runs the tools** and loops; the backend owns the
  key, the frozen system prompt and the tool definitions. The assistant reads; it never writes.
- **Study PDFs** — the backend's `study` module writes a topics outline or study guide from lecture
  captions (`claude-opus-5-5`, structured outputs, every quote and link checked) and prints it with
  headless Chrome.

**How it reaches UD.** None of the three has a public API. The backend signs the student in through
UD's own CAS + Duo in a headless Chrome (one isolated context per student; Duo answered on the site
and relayed), which opens Canvas, Stellic and WebReg by single sign-on. The cookies that leaves live
in an in-memory jar on the student's session; the site's requests go through the backend's proxy
(`/up/<host>/<path>`), which adds them. See [`docs/stellic-integration.html`](docs/stellic-integration.html)
and [`docs/webreg-integration.html`](docs/webreg-integration.html).

No database.

Three rules follow from the subject matter and override convenience:

1. **Never pass invented data off as the student's record.** A grade, date, requirement, credit or
   class time the site or the assistant shows must come from Canvas, Stellic or WebReg, as that
   system states it. Invented data exists only as the stand-in UD's fixtures in `web/preview/`,
   which `src/` never imports.
2. **A student's data goes nowhere it doesn't need to.** Their password is typed into CAS's form
   once and dropped — never stored or logged. Their UD sessions live in server memory only and end
   on sign-out or an hour idle. UD content passes through the proxy to their page, and to the model
   only to answer the question asked; it is never logged (see `svc-log.ts`) or stored. A study PDF
   lives in a `blob:` URL in the student's page.
3. **Registration is real.** A WebReg write enrolls or drops the student for real and can't be
   undone. The site writes only after the student confirms the exact change; the assistant never
   writes; and writes are exercised only against the stand-in (`bun run preview`), never a real
   account.

## Git workflow

**Never commit or push directly to `main`.** All work happens on a branch and lands through a pull
request:

1. Branch from an up-to-date `main`: `git switch main && git pull && git switch -c <type>/<short-name>`
   — `<type>` matches the commit types below (`feat/chat-streaming`, `fix/deadline-timezone`).
2. Commit regularly as you go — one logical step per commit, not one commit at the end.
3. Push the branch and open a PR with `gh pr create` — a summary of what and why, and how it was
   tested.
4. Rebase it onto an up-to-date `main` (`git fetch && git rebase origin/main`), then merge it once
   the work is done and the checks (`bun run lint && bun run test && bun run format:check`) pass —
   CI runs the same on the PR — `gh pr merge --rebase` —
   then start the next piece of work on a fresh branch.

**NEVER delete a branch after it is merged** — not locally, not on the remote. No `--delete-branch`
on `gh pr merge`, no `git branch -d`, no `git push --delete`. Merged branches stay as history.

Keep branches small and short-lived: a PR per feature or fix, not per session.

**Commit messages follow Conventional Commits.** Subject line is `type(scope): summary`: type from
**`feat`** (new capability), **`fix`** (defect), **`refactor`** (behaviour unchanged), **`chore`**
(housekeeping, config, deps) or **`docs`**; scope is the module or feature area in lower-kebab — a
`components/<feature>` folder, a backend module, or a tooling surface (`web`, `backend`,
`shell`, `chat`, `schedule`, `degree`, `grades`, `deadlines`, `support`, `docs`) — omitted when the change is repo-wide,
and comma-joined when a change genuinely spans two (`feat(chat,backend): …`). The summary is
lower-case, imperative, no trailing period, and fits in ~72 characters.

Anything non-trivial gets a body: a short prose paragraph on what changed and why, then bullets
grouped under `Heading:` lines when the change has distinct strands. Close with the
`Co-Authored-By:` trailer. A one-line subject alone is fine for a genuine one-liner.

**NEVER park or discard the working tree.** No `git stash`, no `git checkout -- <file>`, no
`git reset --hard` — not to compare a test baseline, not "just for a second". The tree is shared:
teammates and sibling agents write it concurrently, and the IDE re-saves its buffers when git
changes files underneath it. To check whether a test failure is pre-existing, run the file against
the current tree and reason about whether the change touches that path, or ask. Any git operation
that would overwrite working-tree files is the user's to run, not yours.

## Working alongside other agents

Several agents may work this repo in parallel, and a code review runs at the end to cross-check
it. Do the task, say what was done, stop. Don't re-verify work that already passed, don't re-read a
file to confirm an edit landed, don't re-run a suite "to be sure".

Working-tree changes appearing under you — a file you edited holding different content, a test
failing in code you never touched — are almost always someone else, not corruption and not your
bug. Don't "repair" the tree. Touch only the files your task needs, and mention anything odd in
your final message rather than acting on it.

## Required reading

Before starting any task, read the relevant conventions file in `docs/`:

- Backend: [`docs/backend-conventions.html`](docs/backend-conventions.html) — before any work in `backend/`.
- Site: [`docs/site-conventions.html`](docs/site-conventions.html) — before any work in `web/`.
- Stellic: [`docs/stellic-integration.html`](docs/stellic-integration.html) — before touching `web/src/services/stellic/`.
- WebReg: [`docs/webreg-integration.html`](docs/webreg-integration.html) — before touching `web/src/services/webreg/`.

`docs/` is HTML only — no Markdown originals. Pages share `docs/docs.css` and follow its rule-card
layout (hero → stackline → TOC → numbered rule cards). Classic CSS, no build step, no dependencies —
the pages open straight off disk.

## Hard rules (non-negotiable)

1. **Every source file must be below 200 lines.** Split proactively, not after.
   `backend/tests/architecture/file-length.test.ts` enforces it across every workspace.
2. **The site uses hooks wherever possible** — components never call the network, a UD client or
   `localStorage` directly; every data source lives in a `services/hooks/use-*.ts` hook that owns
   loading/error state.
3. **The `docs/*.html` pages stay current.** A change to a convention updates its page in the same
   commit. **All documentation lives in `docs/` — never inside `src/`.** A file's *why* belongs in
   its header comment.
4. **Env is read in one place.** Backend: only `svc-env.ts` touches `process.env`
   (`tests/architecture/layering.test.ts` enforces it).

## Repo layout

A **Bun workspace** (root `package.json` → `backend`, `web`, `packages/*`). ONE root `bun.lock` and
ONE `bun install` at the root — `bun install` inside an app is wrong and will fight the workspace.

- `backend/` — Bun + Hono API (TypeScript): sign-in, the UD proxy, chat, study PDFs. No database.
- `web/` — the site. Preact + TypeScript, bundled by `Bun.build` (`web/scripts/build.ts`) into
  `web/dist/`; `web/scripts/serve.ts` serves it and relays `/api/*` to the backend.
- `packages/shared/` — `@canvas-assistant/shared`: types BOTH sides use (auth, chat, study, the tool
  definitions). No build step — `main`/`types` point at the TypeScript itself. A type goes here only
  when both sides use it; a view-model the site never sends or receives stays in
  `web/src/services/types`.
- `docs/` — conventions and integrations, as HTML (`docs.css` is shared).

Each app's `tsconfig.json` extends the root `tsconfig.base.json` and overrides only what is its own
(`lib`, `types`, `jsx`, the `@/*` path). Options that belong to both go in the base.

## Common commands

From the repo root: `bun install` (once, for the whole workspace), then:
- `bun run dev:api` — the API on **127.0.0.1:3010** (needs `ANTHROPIC_API_KEY` in `backend/.env`
  for chat, and an installed Chrome, Edge or Chromium — or `CHROME_PATH` — to sign students in and
  print study PDFs). `bun run dev` — build the site in watch mode and serve it on
  **localhost:5175**, relaying `/api` to :3010. Sign in with a real UD account.
- `bun run preview` — the whole site against the **stand-in UD** on :5175, with its own backend on
  :3011 (`UD_STANDIN`): any username and password, Duo approves itself or takes passcode 123456.
  Nothing reaches UD — the only place registration may be exercised.
- `bun run build` — one-off site build into `web/dist/`.
- `bun run lint` — typecheck both. `bun run test` — both suites. `bun run format` /
  `bun run format:check` — Prettier over both (4-space, 250 width, single quotes).
- CI (`.github/workflows/ci.yml`) runs lint, test, format check and the site build on every PR and
  push to `main`. Pushing a tag `vX.Y.Z` matching `web/package.json`'s version publishes `web/dist`
  as a zip on a GitHub Release (`release.yml`).
- `docker compose up -d --build` — the backend alone in a container (root `Dockerfile` +
  `compose.yaml`, env from `backend/.env`), published on loopback only; whatever serves the site
  relays `/api/*` to it over HTTPS.
- `LOGIN_BROWSER_VISIBLE=1` in `backend/.env` shows the sign-in browser — for debugging a change to
  UD's CAS or Duo pages.

## Environment

- Local dev env comes from `backend/.env` (gitignored). `backend/.env.example` is the checked-in
  template and must list every key.
- New env vars go in `EnvKey` + `app_env` + `getEnvStatus()` in `svc-env.ts` **and** `.env.example`
  in the same commit. Read env only through `app_env` — never `process.env.X` elsewhere.
- Any external service the app can run without must **degrade gracefully, never crash** when it is
  absent. The API still boots without a model key or a Chrome, and `/health` still answers.

## Backend architecture

Entry: `backend/src/index.ts` — validates env via `getEnvStatus()`, requires the site's client
header on every write and a signed-in session on `/chat`, `/study` and `/up`, mounts one Hono router
per feature area, and defines the top-level `app.onError`. Path alias `@/*` → `backend/src/*`.

Layering — **central layer dirs** (functional, no classes/DI): `src/routes/<module>/` (thin Hono
routers) → `src/services/<module>/` (business logic). A repositories layer arrives with a database.
`tests/architecture/layering.test.ts` enforces: `src/api/` must not exist, no naked files at
`routes/`, feature services never import Hono.

- `src/routes/<module>/<module>.ts` — exports `router_<module>`; validate, delegate, respond ONLY via
  `rsp(c, data, stc, message)` with the `stc`/`err` enums — never raw `c.json` (the one exception is
  `/up`, which relays UD's response as itself). Hono-Context helpers live here (a module's
  `common.ts` — `routes/auth/common.ts` holds the session cookie and guards), never in services.
- `src/services/<module>/` — business logic. `tests/{routes,services}/` mirror the same shape.
- `src/services/common/svc-*.ts` — cross-cutting clients (env, response, log, the Anthropic SDK, the
  browser: printing, and one isolated context per signing-in student).
- `src/services/auth/` — `POST /auth/{login,duo,logout}`, `GET /auth/status`: the CAS + Duo sign-in
  (`login-flow.ts`, `cas.ts`, `duo.ts` — read by what UD's pages say), opening each service by SSO
  (`ud-services.ts`, `open-service.ts`) and renewing it when it lapses (`renew.ts`), the in-memory
  sessions and cookie jar, and the stand-in sign-in.
- `src/services/upstream/` — `/up/<host>/<path>`: the proxy. `policy.ts` is the allowlist — the
  hosts, and the only writes (Canvas submissions; WebReg `sisqueue` add/drop/swap/edit);
  `headers.ts` adds each system's CSRF and Origin headers; `upstream.ts` follows redirects, keeps the
  jar current, renews a lapsed session once, and maps to the stand-in under `UD_STANDIN`.
- `src/services/chat/` — `POST /chat/turn`: one model call per step. Sonnet 5.5, adaptive thinking at
  `CHAT_EFFORT` (default low), `fallbacks: "default"` for classifier refusals, prompt caching on
  tools + system + conversation. The system prompt in `chat-prompt.ts` is frozen — nothing
  per-request goes in it.
- `src/services/study/` — `POST /study/{digest,plan,section,links,render}`: the study-PDF pipeline,
  one short step per request (types in `packages/shared/src/types/study.ts`). `STUDY_MODEL` (default
  `claude-opus-5-5`) with structured outputs; quotes are checked against the transcript, links against
  the search results; `render/` turns a document into HTML and `svc-browser.ts` prints it.

## Site architecture

Entry: `web/src/main.tsx` — joins the stylesheets into one `<style>` and renders `app.tsx`: the
session gate (`use-session.ts` — the sign-in screen until `/api/auth/status` says signed in), the
hash router (`services/routes.ts`: `#/`, `#/schedule`, `#/courses`, `#/deadlines`, `#/assistant`,
`#/degree`, `#/help`) and the chat conversation, held here so it survives navigation. Path alias
`@/*` → `web/src`.

- `services/api/upstream.ts` — the one way to UD: real URL in, `/api/up/<host>/<path>` out. A 401
  fires `onSignedOut`. `services/api/backend.ts` — our own routes.
- `services/canvas/`, `services/stellic/`, `services/webreg/` — the three clients and their mappers.
  `services/webreg/register.ts` holds the only registration writes (load the term's page, POST,
  poll to completion), reached only from the Schedule page's review dialog.
- `services/media/` + `services/study/` — a course's recorded lectures and the study-PDF pipeline;
  a PDF comes back as an attachment on the assistant's message.
- `services/hooks/use-*.ts` — every data source. `services/tools/` — one executor per shared tool
  name. `services/chat/` — the tool loop and the conversation context. `services/format/` — dates
  and the Markdown parser. `services/dashboard/` — the Canvas–Stellic join by subject + number.
- `components/<feature>/` — `shell/` (sidebar, top bar, phone nav), `signin/`, and one folder per
  page; `common/` holds the icon set, the segmented toggle and `LoadState`.
- The chat conversation is **append-only** and sent back verbatim, thinking blocks included. The
  student context rides in the first user message and each question is stamped with the time
  asked, so the backend's system prompt never changes and stays cached.
- Styling: `src/styles/*.css`, imported as text and joined by `styles/index.ts`. Colours come from
  the tokens in `tokens.css` — never hardcoded in a component: ink outlines on a paper ground, and
  one green (`--ca-accent`, text in `--ca-accent-ink`) for the main action.
- `web/preview/` — the stand-in UD (Canvas, Media Gallery, Stellic, WebReg) over invented
  fixtures, dispatched by `preview/standin.ts`; never bundled.
