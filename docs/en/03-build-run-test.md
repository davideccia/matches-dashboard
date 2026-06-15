# 03 — Build, Run, Test

> See also: [08 — Configuration & Env](08-configuration-env.md), [09 — Dependencies](09-dependencies.md).

The project uses [pnpm](https://pnpm.io) (a fast, disk-efficient Node package manager, ≈ npm with a content-addressable store). `package.json` declares the standard Nuxt scripts; a `Makefile` wraps the common workflows.

## Prerequisites

- Node.js 20 or newer
- pnpm
- The Spring Boot API reachable at the URL `NUXT_PUBLIC_API_BASE` points to (default `http://localhost:8081`)

## Day-to-day commands

```bash
pnpm dev              # dev server with HMR at http://localhost:3000
pnpm build            # production build → .output/public/ (static files)
pnpm preview          # serve the built output locally
pnpm eslint . --fix   # lint and auto-fix
pnpm nuxi typecheck   # type-check the whole project
```

`pnpm dev` runs Vite under the hood (the bundler used by Nuxt 4) and enables Hot Module Replacement (≈ live-reload at the module level, preserving component state where possible).

## Project conventions

- **Always run lint after a coding session** — the repo enforces `@antfu/eslint-config` (single quotes, no semicolons, sorted imports). See `eslint.config.mjs`. The contract is documented in `CLAUDE.md`.
- **Italian-first i18n** — when adding any user-facing string, add both `i18n/locales/it.json` and `i18n/locales/en.json` keys. See [04](04-ui-navigation.md).
- **No tests in this repo.** There is no test runner configured. UI changes are verified by hand against a live API.

## Production build

`pnpm build` writes `.output/public/` (a folder of `index.html`, hashed `.js`, `.css`, and static assets). Because `ssr: false`, this is *all* you deploy — no Node process at runtime.

`NUXT_PUBLIC_API_BASE` is read **at build time** and baked into the bundle. Changing it later requires a rebuild.

## Docker

The repository ships a multi-stage `Dockerfile`:

1. **Builder stage** — `node:20-alpine`, installs deps with pnpm, runs `pnpm build`.
2. **Runtime stage** — `nginx:alpine`, copies `.output/public/` into `/usr/share/nginx/html/` and uses the bundled `nginx.conf`.

`nginx.conf` does one important thing: `try_files $uri $uri/ /index.html;` — any unknown path falls back to `index.html` so Vue Router can resolve client-side routes after a hard refresh.

```bash
docker build --build-arg NUXT_PUBLIC_API_BASE=https://api.example.com -t matches-dashboard .
docker run -p 8080:80 matches-dashboard
```

The `Makefile` provides `make setup`, `make dev`, `make build`, `make docker-build` as shortcuts.
