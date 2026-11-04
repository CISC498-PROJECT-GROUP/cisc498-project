# Canvas Assistant

A Chrome extension that adds an AI assistant to the Canvas dashboard. Ask about due dates, grades,
late policies, office hours, or anything in a syllabus. It answers from your own Canvas courses and
finds the syllabus even when it's buried in a page or a PDF.

It also has a **student dashboard**: a full page that puts Canvas next to
[Stellic](https://stellic.udel.edu), UD's degree planner. It shows this semester's courses with
grades and what's due, your progress toward the degree, next semester's plan, and your advisor.

## Run it

Requires [Bun](https://bun.sh) 1.3+ and Chrome (or any Chromium browser).

```sh
bun install                              # once, at the repo root
cp backend/.env.example backend/.env     # then put your ANTHROPIC_API_KEY in it
bun run dev:api                          # the assistant server, 127.0.0.1:3010
bun run dev                              # builds extension/dist/ and rebuilds on change
```

Then open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and pick
`extension/dist/`. Open your Canvas dashboard; the assistant button is in the bottom-right corner.
After a rebuild, press the extension's reload arrow and refresh the Canvas tab.

The extension runs on `*.instructure.com` (UD's Canvas is `udel.instructure.com`). For another
school's Canvas domain, add it to `extension/static/manifest.json`.

**Just want to try it?** Each [GitHub Release](../../releases) has the built extension as a zip:
unzip it and **Load unpacked** the folder. It still needs the assistant server running locally.

Before opening a PR, run what CI runs: `bun run lint && bun run test && bun run format:check`
(`bun run format` fixes formatting).

**No Canvas login handy?** `bun run --cwd extension preview` serves a stand-in dashboard at
http://localhost:5174 with a fake Canvas API behind it. Chat still goes to the real assistant server.

## The dashboard (Canvas + Stellic)

Click the extension's toolbar icon to open the dashboard in a new tab. It needs you signed in to
both Canvas and Stellic in the same browser, and it doesn't need the assistant server.

- **This semester:** each course you're registered for in Stellic, joined to its Canvas site:
  credits and status from Stellic, your current grade and next assignment from Canvas.
- **Coming up:** Canvas work due in the next two weeks.
- **Degree progress:** each program in your Stellic audit, with credits earned, in progress, planned
  and still needed, and the requirements still open.
- **Next semester, advising and history:** your plan for next term, your advisor and plan review
  status, and every past term's grades.

If Stellic's session has expired (it times out after an hour idle), the Stellic cards say so and
link to Stellic. Sign in there and come back to the tab: the cards reload on their own.

Stellic has no public API. The dashboard reads the same internal endpoints Stellic's own web app
uses, with your own session, and it only reads. This is UD-only and experimental, done with
permission from Stellic's technical team and our instructor. The endpoints could change with any
Stellic release. Details: [`docs/stellic-integration.html`](docs/stellic-integration.html).

## Run the server on a home server

Only the assistant server needs hosting — the extension still loads from `extension/dist/` on each
machine. On the server, with Docker (or Podman) and `backend/.env` filled in:

```sh
docker compose up -d --build             # the API on the server's 127.0.0.1:3010
```

It has no auth and spends your API key for whoever reaches it, so it is published on the server's
loopback only. Reach it over Tailscale or a reverse proxy, then build the extension against that
address: `CANVAS_ASSISTANT_API=https://assistant.example.ts.net bun run build`.

## How it works

The extension reads Canvas through its REST API using your existing login: no token, read-only,
and it sees only what you can see. Questions go to the backend, which asks Claude. Claude calls
tools (planner, grades, syllabus, pages, modules, files) that the extension runs against Canvas,
and it answers from what those return.

The dashboard page calls Canvas the same way, and calls Stellic with your Stellic session. Stellic's
data stays in your browser: nothing from it goes to the backend or gets stored.

More: [`CLAUDE.md`](CLAUDE.md) and [`docs/`](docs/).
