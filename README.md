# Canvas Assistant

A Chrome extension that adds an AI assistant to the Canvas dashboard — ask about due dates, grades,
and what's in a syllabus.

## Run it

Requires [Bun](https://bun.sh) 1.3+ and Chrome (or any Chromium browser).

```sh
bun install        # once, at the repo root
bun run dev        # builds extension/dist/ and rebuilds on change
```

Then open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and pick
`extension/dist/`. Open your Canvas dashboard — the assistant button is in the bottom-right corner.
After a rebuild, press the extension's reload arrow and refresh the Canvas tab.

No Canvas login handy? `bun run --cwd extension preview` serves a stand-in dashboard at
http://localhost:5174.

The API (`bun run dev:api`, port 3010) isn't used by the extension yet.

## More

Architecture, conventions and commands: [`CLAUDE.md`](CLAUDE.md) and [`docs/`](docs/).
