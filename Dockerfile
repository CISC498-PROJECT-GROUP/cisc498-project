# The backend API as a container, for running it on a server. Only the backend ships: the extension
# is built on a dev machine and loaded into Chrome, never served from here.
#
# Built from the repo root because the backend is a workspace member — it needs the root lockfile,
# tsconfig.base.json and packages/shared. Bun runs the TypeScript directly; there is no build step.
#
#   docker compose up -d --build        (see compose.yaml)

FROM docker.io/oven/bun:1.3-slim

WORKDIR /app

# Every workspace member's package.json must be present for the frozen lockfile to match, even the
# extension's; only production dependencies are installed.
COPY package.json bun.lock bunfig.toml tsconfig.base.json ./
COPY backend/package.json backend/
COPY extension/package.json extension/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile --production

COPY packages/shared packages/shared
COPY backend/tsconfig.json backend/
COPY backend/src backend/src

# Inside the container the API must listen on every interface, or the published port reaches
# nothing. Who can reach it is decided by the port mapping in compose.yaml, not here.
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3010
EXPOSE 3010

USER bun
WORKDIR /app/backend
HEALTHCHECK --interval=30s --timeout=3s CMD bun -e "fetch('http://127.0.0.1:3010/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["bun", "src/index.ts"]
