# Canvas Assistant

A Chrome extension that adds an AI assistant to the Canvas dashboard. Ask about due dates, grades,
late policies, office hours, or anything in a syllabus. It answers from your own Canvas courses and
finds the syllabus even when it's buried in a page or a PDF.

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

The extension runs on `*.instructure.com` and `canvas.udel.edu`. For another school's Canvas domain,
add it to `extension/static/manifest.json`.

**No Canvas login handy?** `bun run --cwd extension preview` serves a stand-in dashboard at
http://localhost:5174 with a fake Canvas API behind it. Chat still goes to the real assistant server.

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

More: [`CLAUDE.md`](CLAUDE.md) and [`docs/`](docs/).
