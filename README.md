# Matches Dashboard

Static SPA admin dashboard and public scoreboard for **Matches**, a combat-sports tournament management platform. Built with [Nuxt 4](https://nuxt.com) and [Nuxt UI](https://ui.nuxt.com), it talks exclusively to a separate [Laravel API](https://codeberg.org/davideccia/matches-api-laravel) over HTTP and WebSocket — this repo has no server-side business logic, persistence, or auth of its own.

## Features

- **Admin console** (`/admin`) — manage tournaments, athletes, disciplines, weight categories, experience tiers, and users through a consistent paginated-table + slideover-form pattern, behind Sanctum token authentication.
- **Public pages** (`/public`) — unauthenticated athlete registration and a live tournament scoreboard, with no login required.
- **Realtime match board** — the scoreboard and the admin match board subscribe to Laravel Reverb over WebSocket and auto-scroll to the active bout as matches progress.
- **Runtime API repointing** — a hidden gesture (5 clicks on the logo, then a password) lets an already-built bundle be redirected to a different API/WebSocket environment without a rebuild.
- **i18n** — Italian (default) and English, fully covered by translation keys.

## Requirements

- [Node.js](https://nodejs.org) 22+
- [pnpm](https://pnpm.io) 10+
- A running instance of the [Laravel API](https://codeberg.org/davideccia/matches-api-laravel) (and optionally [Reverb](https://reverb.laravel.com) for realtime features)

## Getting started

```bash
pnpm install
cp .env.example .env
pnpm dev
```

The dev server starts at `http://localhost:3000`. To expose it on your LAN:

```bash
make dev-host
```

> [!NOTE]
> This app is a **static SPA** (`ssr: false`). There is no server-rendering and no server-side data layer — every environment variable is baked into the built bundle at build time (see [Configuration](#configuration)).

## Commands

A `Makefile` wraps the common tasks (`make help` lists all targets):

| Command             | Description                                          |
| -------------------- | ----------------------------------------------------- |
| `make dev`           | Start the dev server on `localhost:3000`              |
| `make dev-host`      | Start the dev server exposed on `0.0.0.0` (LAN)       |
| `make lint`          | Run ESLint (no auto-fix)                              |
| `make lint-fix`      | Run ESLint with auto-fix                              |
| `make clean`         | Remove `.nuxt`, `.output`, `dist`                     |
| `pnpm generate`      | Build the static SPA into `.output/public/`           |

> [!WARNING]
> `make typecheck` does not currently work: `nuxi typecheck` shells out to an npx-installed `vue-tsc` that fails to resolve this project's TypeScript version. There is also no automated test suite — validate changes with `make lint-fix` and by running the app against a live API.

## Configuration

Because the build is static, these are the **only** environment variables the app reads, and they must be set **at build time** (they end up baked into `index.html`):

| Variable                            | Default                  | Purpose                                                        |
| ------------------------------------ | ------------------------- | --------------------------------------------------------------- |
| `NUXT_BASE_URL`                     | `https://api.matches.it` | Laravel API base URL                                            |
| `NUXT_PUBLIC_REVERB_APP_KEY`        | —                         | Laravel Reverb app key                                          |
| `NUXT_PUBLIC_REVERB_HOST`           | `localhost`               | Reverb WebSocket host                                            |
| `NUXT_PUBLIC_REVERB_PORT`           | `8080`                    | Reverb WebSocket port                                            |
| `NUXT_PUBLIC_REVERB_SCHEME`         | `http`                    | `http` or `https`                                                |
| `NUXT_PUBLIC_ENV_SWITCHER_PASSWORD` | —                         | Password unlocking the runtime API switcher. Empty disables it. |

> [!IMPORTANT]
> `NUXT_PUBLIC_ENV_SWITCHER_PASSWORD` is not a secret in any real sense — it is a `NUXT_PUBLIC_*` value shipped in the clear inside the bundle. It guards no data; it only prevents accidental fat-fingering of the API environment from the UI. Anyone can achieve the same effect from the browser console.

For a one-off repoint of an already-built bundle without a rebuild, use the runtime override: click the app logo 5 times within 1.5 seconds, enter the password, and pick an environment from the switcher.

## Deployment

Two supported targets:

- **Docker** (`docker/production/`) — builds with `pnpm build` (Nitro `node-server` target) and runs under PM2 in a `node:22-alpine` image. See `docker/production/README.md` for the CI-ready build invocation and reverse-proxy notes.
- **AWS Amplify Hosting** — builds with `pnpm generate` and serves `.output/public` statically. Requires an SPA rewrite of every non-asset path to `/index.html` (status `200`) configured in the Amplify console, since static generation emits nothing for dynamic routes.

Both targets need the six build-time variables above set for each environment, and the deploying domain must be present in the Laravel API's CORS allowlist and in Reverb's allowed origins.

> [!NOTE]
> Security headers (`X-Content-Type-Options`, HSTS, CSP, etc.) are served by Nitro and only apply to the Docker target. Amplify ships none of them unless replicated in the console.

## Architecture at a glance

- **Two audiences, one app**: `/admin/**` is Sanctum-authenticated and protected by default; `/public/**` explicitly opts out of authentication per page.
- **`useApi()`** wraps the Sanctum HTTP client for all admin requests; **`useAuth()`** wraps Sanctum's auth composable.
- **`useApiConfig()`** resolves the active API/Reverb configuration from a `localStorage` override, falling back to build-time env vars, falling back to a hardcoded default.
- Realtime updates are notify-then-refetch: WebSocket events only signal that something changed, and the page refetches over REST — no domain data ever travels over the socket.
