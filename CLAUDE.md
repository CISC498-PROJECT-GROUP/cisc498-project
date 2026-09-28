# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Canvas Assistant** — a browser extension that puts an AI assistant on the Canvas LMS dashboard. A
student asks it about their classes — what is due, what a syllabus says, where their grade stands —
and it answers from the courses they are enrolled in. It also offers quick views: grade breakdown,
upcoming deadlines across every course, and where to get help.

The build is a **prototype**, delivered in three milestones:

1. **The widget on Canvas** — done. The extension injects the assistant on the dashboard. Its data
   is placeholder (`extension/src/services/sample/`, badged "Sample data" in every view that shows
   it) and the chat answers with a fixed stub.
2. **AI integration** — the chat calls `backend/`, which calls the model. The model key lives in the
   backend and never in the extension.
3. **Canvas API** — the hooks read the student's real courses, assignments, grades and syllabi. The
   content script runs on the Canvas origin, so a same-origin `fetch('/api/v1/…')` carries the
   student's own session: no token, no OAuth, and it sees exactly what the student can see.

No database for now.

Two rules follow from the subject matter and override convenience:

1. **Never pass invented data off as the student's record.** Placeholder data is always flagged
   (`isSample` on every hook's result, which renders the badge) and the sample folder is deleted, not
   kept as a fallback, once real data flows. A grade or a due date the assistant states must come
   from Canvas.
2. **A student's data goes nowhere it doesn't need to.** Canvas content is sent to the backend only
   to answer the question asked, is never logged (see `svc-log.ts`), and is never stored.

## Git workflow

**Never commit or push directly to `main`.** All work happens on a branch and lands through a pull
request:

1. Branch from an up-to-date `main`: `git switch main && git pull && git switch -c <type>/<short-name>`
   — `<type>` matches the commit types below (`feat/chat-streaming`, `fix/deadline-timezone`).
2. Commit regularly as you go — one logical step per commit, not one commit at the end.
3. Push the branch and open a PR with `gh pr create` — a summary of what and why, and how it was
   tested.
4. Merge it once the work is done and the checks (`bun run lint && bun run test`) pass —
   `gh pr merge --squash --delete-branch` — then start the next piece of work on a fresh branch.

Keep branches small and short-lived: a PR per feature or fix, not per session.

**Commit messages follow Conventional Commits.** Subject line is `type(scope): summary`: type from
**`feat`** (new capability), **`fix`** (defect), **`refactor`** (behaviour unchanged), **`chore`**
(housekeeping, config, deps) or **`docs`**; scope is the module or feature area in lower-kebab — a
`components/<feature>` folder, a backend module, or a tooling surface (`extension`, `backend`,
`shell`, `chat`, `grades`, `deadlines`, `support`, `docs`) — omitted when the change is repo-wide,
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
- Extension: [`docs/extension-conventions.html`](docs/extension-conventions.html) — before any work in `extension/`.

`docs/` is HTML only — no Markdown originals. Pages share `docs/docs.css` and follow its rule-card
layout (hero → stackline → TOC → numbered rule cards). Classic CSS, no build step, no dependencies —
the pages open straight off disk.

## Hard rules (non-negotiable)

1. **Every source file must be below 200 lines.** Split proactively, not after.
   `backend/tests/architecture/file-length.test.ts` enforces it across every workspace.
2. **The extension uses hooks wherever possible** — components never call the network, Canvas or
   `chrome.*` directly; every data source lives in a `services/hooks/use-*.ts` hook that owns
   loading/error state.
3. **The `docs/*.html` pages stay current.** A change to a convention updates its page in the same
   commit. **All documentation lives in `docs/` — never inside `src/`.** A file's *why* belongs in
   its header comment.
4. **Env is read in one place.** Backend: only `svc-env.ts` touches `process.env`
   (`tests/architecture/layering.test.ts` enforces it).

## Repo layout

A **Bun workspace** (root `package.json` → `backend`, `extension`, `packages/*`). ONE root
`bun.lock` and ONE `bun install` at the root — `bun install` inside an app is wrong and will fight
the workspace.

- `backend/` — Bun + Hono API (TypeScript). No database.
- `extension/` — Chrome Manifest V3 extension. Preact + TypeScript, bundled by `Bun.build`
  (`extension/scripts/build.ts`) into `extension/dist/`, which is what Chrome loads.
- `packages/shared/` — `@canvas-assistant/shared`: types BOTH sides use. No build step —
  `main`/`types` point at the TypeScript itself. A type goes here only when both sides use it; a
  view-model the extension never sends or receives stays in `extension/src/services/types`.
- `docs/` — conventions, as HTML (`docs.css` is shared).

Each app's `tsconfig.json` extends the root `tsconfig.base.json` and overrides only what is its own
(`lib`, `types`, `jsx`, the `@/*` path). Options that belong to both go in the base.

## Common commands

From the repo root: `bun install` (once, for the whole workspace), then:
- `bun run dev` — build the extension in watch mode. `bun run dev:api` — the API on **:3010**.
- `bun run build` — one-off extension build into `extension/dist/`.
- `bun run lint` — typecheck both. `bun run test` — both suites.

**Loading the extension:** `chrome://extensions` → Developer mode → *Load unpacked* →
`extension/dist/`. After a rebuild, press the extension's reload arrow, then refresh the Canvas tab —
Chrome does not pick up a rebuild on its own.

**Without a Canvas login:** `bun run --cwd extension preview` serves a stand-in dashboard on
**:5174** that runs the same `content.js`. Only valid while the content script uses no `chrome.*`
API.

Backend (inside `backend/`): `bun run dev` (watch), `bun run test`, `bun run lint`,
`bun run format` (Prettier — 4-space, 250 width, single quotes; the extension uses the same config).

## Environment

- Local dev env comes from `backend/.env` (gitignored). `backend/.env.example` is the checked-in
  template and must list every key.
- New env vars go in `EnvKey` + `app_env` + `getEnvStatus()` in `svc-env.ts` **and** `.env.example`
  in the same commit. Read env only through `app_env` — never `process.env.X` elsewhere.
- Any external service the app can run without must **degrade gracefully, never crash** when it is
  absent. The API still boots without a model key and `/health` still answers.

## Backend architecture

Entry: `backend/src/index.ts` — validates env via `getEnvStatus()`, mounts one Hono router per
feature area, and defines the top-level `app.onError`. Path alias `@/*` → `backend/src/*`.

Layering — **central layer dirs** (functional, no classes/DI): `src/routes/<module>/` (thin Hono
routers) → `src/services/<module>/` (business logic). A repositories layer arrives with a database.
`tests/architecture/layering.test.ts` enforces: `src/api/` must not exist, no naked files at
`routes/`, feature services never import Hono.

- `src/routes/<module>/<module>.ts` — exports `router_<module>`; validate, delegate, respond ONLY via
  `rsp(c, data, stc, message)` with the `stc`/`err` enums — never raw `c.json`. Hono-Context helpers
  live here (a module's `common.ts`), never in services.
- `src/services/<module>/` — business logic. `tests/{routes,services}/` mirror the same shape.
- `src/services/common/svc-*.ts` — cross-cutting clients (env, response, log, …).

## Extension architecture

Entry: `extension/src/content.tsx` — the content script. It mounts only when
`services/canvas/canvas-page.ts` says the page is the dashboard, and renders into a **shadow root**
on its own host element: Canvas's CSS cannot restyle the widget and the widget's CSS cannot leak
onto Canvas. Path alias `@/*` → `extension/src`.

- `app.tsx` — open/closed, the current view, and the chat conversation (held here so it survives a
  trip back to the menu). Keyboard events are stopped at this root — Canvas binds global shortcuts
  on `document`, and typing in the chat box would otherwise trigger them.
- `components/<feature>/` — `shell/` is the launcher and panel chrome; `home/`, `chat/`,
  `grades/`, `deadlines/`, `support/` are the views; `common/` holds the icon set and badges.
- `services/hooks/use-*.ts` — every data source. `services/types/` — view-models.
  `services/format/` — pure formatting. `services/sample/` — placeholder data, deleted in milestone 3.
- Styling: `src/styles/*.css`, imported as text and joined into one `<style>` in the shadow root by
  `styles/index.ts`. Colours come from the tokens in `tokens.css` — never hardcoded in a component.
  The accent is the school's own Canvas brand colour (`--ic-brand-primary`, which inherits into the
  shadow root), falling back to a fixed blue.
- The manifest is `extension/static/manifest.json`, copied into `dist/` by the build. It matches
  `*.instructure.com` and `canvas.udel.edu`; add a school's self-hosted domain there.
