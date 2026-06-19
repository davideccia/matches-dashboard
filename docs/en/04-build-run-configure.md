# 04 — Build, run & configure

> See also: [01 — Overview](01-overview.md), [09 — Realtime scoreboard](09-realtime-scoreboard.md)

This chapter explains how to run the app locally, how it's configured, and how it's packaged for production. A command summary is also in [`CLAUDE.md`](../../CLAUDE.md) and [`README.md`](../../README.md); here we add the *why*.

## Commands

```bash
pnpm dev              # dev server at http://localhost:3000
pnpm build            # production build → .output/public/ (static, ssr: false)
pnpm preview          # serve the build locally
pnpm eslint . --fix   # lint + auto-fix (run after every session)
pnpm nuxi typecheck   # TypeScript type-check
```

> At the end of a coding session, [`CLAUDE.md`](../../CLAUDE.md) asks you to always run `pnpm eslint . --fix` and report any non-auto-fixable errors.

## `ssr: false`: what it really means

[`nuxt.config.ts`](../../nuxt.config.ts) (line 5) has `ssr: false`. It disables *Server-Side Rendering*: Nuxt does **not** generate a Node server that produces HTML on each request. Instead, the build produces a set of **static files** (HTML/JS/CSS) in `.output/public/`, served by any web server (here, nginx).

From this follows the single most important configuration rule:

> [!IMPORTANT]
> All `NUXT_PUBLIC_*` variables are **baked into the bundle at build time**, not read at runtime. They must be set *before* `pnpm build` or `docker build`. Changing them after the build has no effect — you have to rebuild.

The reason: with no server, there's nobody at runtime to read the process's environment variables; the only moment they exist is during the build.

## Environment variables

Defined in [`nuxt.config.ts`](../../nuxt.config.ts) under `runtimeConfig.public` (lines 32-41), with their defaults:

| Variable | Default | Purpose |
|----------|---------|---------|
| `NUXT_PUBLIC_API_BASE` | `http://localhost:8081` | Laravel API base URL |
| `NUXT_PUBLIC_WS_BASE` | `` (empty) | Alternative WebSocket base (currently unused in the code) |
| `NUXT_PUBLIC_REVERB_APP_KEY` | `` (empty) | Reverb app key |
| `NUXT_PUBLIC_REVERB_HOST` | `localhost` | Reverb WebSocket host |
| `NUXT_PUBLIC_REVERB_PORT` | `8080` | Reverb WebSocket port |
| `NUXT_PUBLIC_REVERB_SCHEME` | `http` | `http` or `https` |

`NUXT_PUBLIC_API_BASE` is also reused by Sanctum's config as its `baseUrl` ([`nuxt.config.ts`](../../nuxt.config.ts) line 71). The Reverb variables feed the Echo plugin (see [Chapter 09](09-realtime-scoreboard.md)).

To point at a backend on a different port during development:

```bash
NUXT_PUBLIC_API_BASE=http://localhost:9090 pnpm dev
```

## Production build and Docker

`pnpm build` produces a static site in `.output/public/` — no Node server needed at runtime. The recommended path is the included Docker image:

```bash
docker build \
  --build-arg NUXT_PUBLIC_API_BASE=https://api.example.com \
  -t matches-dashboard .

docker run -p 80:80 matches-dashboard
```

The [`Dockerfile`](../../Dockerfile) is multi-stage: it first builds the app with Node, then serves the static output from `nginx:alpine`. The API URL is passed as a *build arg* because — as explained above — it must be known at build time.

### SPA routing in nginx

[`nginx.conf`](../../nginx.conf) handles SPA routing with `try_files … /index.html`. Without this rule, a *hard refresh* on a deep URL like `/admin/tournaments` would 404: nginx would look for a `/admin/tournaments` file that doesn't exist. With `try_files`, any not-found path falls back to `index.html`, and then Vue's client-side router resolves the correct route.

> [!IMPORTANT]
> Both the Laravel API and the Reverb WebSocket endpoint must be reachable **from the browser** at the addresses configured in the `NUXT_PUBLIC_*` variables, otherwise login and live features won't work.
