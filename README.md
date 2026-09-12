<div align="center">

# Matches Dashboard [(Laravel Backend)](https://github.com/davideccia/matches-api)

Frontend for an amateur combat-sports tournament management platform.

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt.js&logoColor=white)](https://nuxt.com)
[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Nuxt UI 4](https://img.shields.io/badge/Nuxt%20UI-4-00DC82?logo=nuxt.js&logoColor=white)](https://ui.nuxt.com)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)

</div>

A single [Nuxt 4](https://nuxt.com) application serving two audiences: **organisers** managing tournaments, athletes and match scores, and **the public** (athletes and spectators) registering for events and following live results.

> [!NOTE]
> This is a **thin SPA client**. All persistence, business rules, and authentication live in a separate [**Laravel API**](https://codeberg.org/davideccia/matches-api-laravel). This repo only renders the UI, validates input, and talks HTTP + WebSocket. Because the app runs with `ssr: false`, it builds to static files with **no Node.js server required at runtime** (Docker still runs one — see [Deployment](#deployment)).

## Features

- **Admin panel** — full CRUD over athletes, tournaments, disciplines, weight categories, experience tiers, and users, with paginated tables, server-side search, and bulk delete.
- **Tournament workspace** — one page per tournament (`/admin/tournaments/{id}`) covering registry, registrations, matches list, and matches board.
- **Live scoreboard** — Laravel Echo + Reverb with a _notify-then-refetch_ pattern that keeps REST as the single source of truth.
- **Match board** — a grid view of a tournament's bouts that auto-scrolls to the active (or next scheduled) match.
- **PDF exports** — per-tournament match list and detailed match sheets, streamed from the API as downloads.
- **Public registration** — an unauthenticated athlete sign-up flow for open tournaments.
- **Bilingual** — Italian (default, no URL prefix) and English under `/en/`.
- **Runtime theming** — admins pick a primary colour that persists to a cookie, plus light/dark mode following the OS preference.
- **Runtime API switching** — repoint an already-built bundle at a different API without a rebuild (see [Configuration](#configuration)).
- **Fully typed** — TypeScript end-to-end with Zod-validated forms.

## Architecture

```
Browser (Nuxt SPA)  ──REST + Sanctum token──►  Laravel API  ──►  Database
        │                                            ▲
        └──────WebSocket (Echo / Reverb)─────────────┘
```

The app splits into two route namespaces:

| Namespace | URL prefix            | Auth                   | Purpose                                  |
| --------- | --------------------- | ---------------------- | ---------------------------------------- |
| Admin     | `/admin/**`, `/login` | Sanctum token (cookie) | Full tournament management               |
| Public    | `/public/**`          | none                   | Athlete registration and live scoreboard |

Sanctum's global middleware protects every route by default; public pages opt out with `definePageMeta({ sanctum: { excluded: true } })`. The root `/` is a **landing page** offering the three entry points (admin sign-in, athlete registration, live scoreboard); it is marked `guestOnly`, so an already-authenticated admin is redirected straight to `/admin`.

## Tech stack

| Layer             | Technology                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Framework         | [Nuxt 4](https://nuxt.com) (`ssr: false` — static SPA output)                                        |
| Component library | [@nuxt/ui v4](https://ui.nuxt.com) — 125+ accessible Vue components                                  |
| Styling           | [Tailwind CSS v4](https://tailwindcss.com)                                                           |
| Auth              | [nuxt-auth-sanctum](https://github.com/manchenkoff/nuxt-auth-sanctum) (Laravel Sanctum, token mode)  |
| Realtime          | [Laravel Echo](https://laravel.com/docs/broadcasting) + Reverb (via [pusher-js](https://pusher.com)) |
| i18n              | [@nuxtjs/i18n](https://i18n.nuxtjs.org)                                                              |
| Form validation   | [Zod v4](https://zod.dev)                                                                            |
| Package manager   | [pnpm](https://pnpm.io)                                                                              |
| Backend           | Laravel API (separate repository)                                                                    |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 22 (see [`.nvmrc`](.nvmrc)) and [pnpm](https://pnpm.io)
- The Laravel API reachable at `NUXT_BASE_URL` (defaults to `https://api.matches.it`), with [Reverb](https://reverb.laravel.com) available for realtime features

### Install and run

```bash
pnpm install
make dev     # dev server exposed on 0.0.0.0 (LAN) → http://localhost:3000
```

`make dev` binds to `0.0.0.0` so phones and tablets on the same network can reach the dev server — handy for testing the public scoreboard on a real device. Use `pnpm dev` for a localhost-only server.

To target a backend on a different host or port:

```bash
NUXT_BASE_URL=http://localhost:8081 pnpm dev
```

> [!IMPORTANT]
> The six `NUXT_*` / `NUXT_PUBLIC_*` variables below are baked into the bundle **at build time** — they end up in the `index.html` payload, not in the `_nuxt/` assets. Set them before running `pnpm generate` (or as build-time variables on your host); changing them afterwards requires a rebuild.

## Configuration

| Variable                            | Default                  | Purpose                                                                                         |
| ----------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `NUXT_BASE_URL`                     | `https://api.matches.it` | Laravel API base URL. **Not** a `NUXT_PUBLIC_*` name — read directly into `sanctum.baseUrl`.    |
| `NUXT_PUBLIC_REVERB_APP_KEY`        | —                        | Laravel Reverb app key                                                                          |
| `NUXT_PUBLIC_REVERB_HOST`           | `localhost`              | Reverb WebSocket host                                                                           |
| `NUXT_PUBLIC_REVERB_PORT`           | `8080`                   | Reverb WebSocket port                                                                           |
| `NUXT_PUBLIC_REVERB_SCHEME`         | `http`                   | `http` or `https`                                                                               |
| `NUXT_PUBLIC_ENV_SWITCHER_PASSWORD` | —                        | Unlocks the runtime API switcher from `/login`. Empty ⇒ the gesture is disabled (fails closed). |

These six are the **only** environment variables the app reads. See [`.env.example`](.env.example) for a starting point.

### Runtime API override

Because the build is static, there is no server to re-read env vars. `useApiConfig()` therefore resolves the API and Reverb settings from three tiers, in order: a per-browser override in `localStorage` (`matches.api-override`), the `NUXT_PUBLIC_*` values baked in at build time, then the first entry of `API_ENDPOINTS` in [`app/utils/constants.ts`](app/utils/constants.ts).

The override is reachable through a deliberate gesture: **five clicks on the logo** (within 1.5 s of each other) on `/login` or in the admin sidebar, then the password above. It covers the base URL and all four Reverb values, and applying it reloads the page, since Echo connects once at plugin init.

> [!WARNING]
> That password is obfuscation, not access control — it is a `NUXT_PUBLIC_*` value in a static bundle, and anyone can set `matches.api-override` from the browser console anyway. It guards no data: the override is per-browser and the API still authenticates every request. Don't reuse a password that means anything elsewhere. For a whole deploy, change the build-time variables instead.

## Routes

| URL                                       | Audience | Description                                                             |
| ----------------------------------------- | -------- | ----------------------------------------------------------------------- |
| `/`                                       | Everyone | Landing page — links to sign-in, registration, and the scoreboard       |
| `/login`                                  | Admin    | Sign-in page                                                            |
| `/forgot-password`, `/reset-password`     | Admin    | Password recovery flow                                                  |
| `/admin`                                  | Admin    | Dashboard home                                                          |
| `/admin/tournaments`                      | Admin    | Tournament list, bulk delete, PDF exports                               |
| `/admin/tournaments/{id}`                 | Admin    | Tournament workspace — registry, registrations, matches list, and board |
| `/admin/athletes`                         | Admin    | Manage athletes                                                         |
| `/admin/athletes/{id}/match_records`      | Admin    | Athlete match records — summary and history grid                        |
| `/admin/configurations/disciplines`       | Admin    | Manage disciplines                                                      |
| `/admin/configurations/weight_categories` | Admin    | Manage weight categories                                                |
| `/admin/configurations/experience_tiers`  | Admin    | Manage experience tiers                                                 |
| `/admin/configurations/users`             | Admin    | Manage admin users                                                      |
| `/admin/settings`                         | Admin    | Theme colour, light/dark mode, and locale preferences                   |
| `/public/athletes/registration`           | Public   | Athlete registration form                                               |
| `/public/tournaments/match_records`       | Public   | Live scoreboard with realtime updates                                   |

Every path above also exists under `/en/` for the English locale.

## Domain model

| Entity              | Description                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Tournament**      | A scheduled event. Status: `scheduled` → `registrations_opened` → `registrations_closed` → `in_progress` → `completed` (or `cancelled`). |
| **Athlete**         | A person record, identified by tax number.                                                                                               |
| **Registration**    | An athlete's entry into a tournament with a discipline and weight category, reviewed by an admin.                                        |
| **Match record**    | A single bout between two athletes — tracks corners, judge scores, end method, and winner.                                               |
| **Discipline**      | A fighting style (rounds, minutes per round).                                                                                            |
| **Weight category** | A weight bracket.                                                                                                                        |
| **Experience tier** | A skill bracket defined by a match-count range (`min–max`, `∞` when open-ended), used to pair comparable opponents.                      |

Backend enum values (`TOURNAMENT_STATUSES`, `MATCH_STATUSES`, `END_METHODS`, `GENDERS`, `CLIENT_TYPES`) are mirrored as `as const` arrays in [`app/utils/constants.ts`](app/utils/constants.ts) — import from there instead of hardcoding strings. Domain interfaces live in [`app/types/models.ts`](app/types/models.ts). The authoritative schema lives in the Laravel API repository.

## Realtime scoreboard

The public scoreboard uses a **notify-then-refetch** pattern over Laravel Echo + Reverb, never sending domain data over the socket:

1. On tournament selection, the client subscribes to the public channel `tournaments.{id}.match_records`.
2. When the server broadcasts a `.MatchRecordChanged` event with `refresh: true`, the client discards the payload and issues a fresh `GET` for the full match list.
3. On tournament change or unmount, the channel is left before any re-subscribe. The Echo socket itself stays open — it is created once by the plugin.

This keeps REST as the single source of truth and avoids WebSocket payload drift.

## Project structure

```
app/
├── components/
│   ├── panels/       # *FormPanel slideovers (auto-registered without a path prefix)
│   ├── tournaments/  # The tab bodies of the tournament workspace (incl. the matches board)
│   └── *.vue         # DataTable, ApiSelectMenu, ApiEnvironment*, MatchRecord*, switchers
├── composables/      # useApi, useApiConfig, useAuth, useEcho, useUser,
│                     # useTournamentMatchRecords, useColorPreference, useAppLogo
├── layouts/          # default.vue — collapsible sidebar shell for admin pages
├── pages/
│   ├── admin/        # Authenticated pages (tournaments, configurations, settings)
│   ├── public/       # Registration form and live scoreboard
│   └── *.vue         # Landing page, login, password recovery
├── plugins/          # echo.client.ts (Reverb), auth.ts, api-base-url.ts, color-preference.client.ts
├── types/            # models.ts — domain TypeScript interfaces
└── utils/            # constants.ts (enums, palette, endpoints), matchRecord.ts, experienceTier.ts, date.ts, authToken.ts
i18n/locales/         # it.json (default), en.json — kept in sync
```

Two conventions worth knowing before adding code: components under `components/panels/` are registered **without** a path prefix (so `<AthleteFormPanel>`, not `<PanelsAthleteFormPanel>`), and every new UI string must be added to **both** locale files.

## Commands

Run `make help` to list all targets. The most common ones:

| Command          | Description                                          |
| ---------------- | ---------------------------------------------------- |
| `make dev`       | Dev server exposed on `0.0.0.0` (LAN)                |
| `make lint`      | Run ESLint (no auto-fix)                             |
| `make lint-fix`  | Run ESLint with auto-fix                             |
| `make typecheck` | Type-check via `nuxi` — currently broken, see below  |
| `make clean`     | Remove `.nuxt`, `.output`, and `dist`                |
| `pnpm generate`  | Static SPA build → `.output/public/`                 |
| `pnpm build`     | Nitro node-server build → `.output/server/` (Docker) |
| `pnpm preview`   | Serve the built output locally                       |

> [!TIP]
> Run `make lint-fix` after every coding session. The repo enforces `@antfu/eslint-config` (single quotes, no semicolons, sorted imports).

> [!WARNING]
> `make typecheck` does not currently run. `nuxi typecheck` shells out to an npx-installed `vue-tsc` that fails to resolve the repo's TypeScript 6 and exits before checking anything — the failure is tooling, not a type error in the code.

There is **no automated test suite** in this repo: no test runner, no test files, no test script. Changes are verified with `make lint-fix` and manual runs against a live API.

## Deployment

Two supported targets, and they no longer ship the same artifact. Both need the six build-time variables above, and whichever host you use, its domain must be in the Laravel API's CORS allowlist and in Reverb's allowed origins.

### Docker

[`docker/production/`](docker/production/) builds a self-hosted image: `pnpm build` (Nitro `node-server` preset) served by a Node process under **PM2** (`ecosystem.config.cjs`), listening on port 3000 as user `node`.

```bash
docker build -f docker/production/Dockerfile -t matches-dashboard:prod \
  --build-arg NUXT_BASE_URL=https://api.matches.it \
  --build-arg NUXT_PUBLIC_REVERB_HOST=reverb.matches.it \
  --build-arg NUXT_PUBLIC_REVERB_SCHEME=https --build-arg NUXT_PUBLIC_REVERB_PORT=443 .
```

The Nitro fallback to `index.html` for dynamic routes is native here, so no rewrite rule is needed. Only **TLS** and **compression** belong to the reverse proxy in front of the container — the security headers and `Cache-Control` come from Nitro (`nuxt.config.ts` → `routeRules`); setting them again on the proxy causes a browser to apply the intersection of two CSPs, breaking the app in hard-to-diagnose ways. See [`docker/production/README.md`](docker/production/README.md) for the full hardening checklist.

### Static hosting (e.g. AWS Amplify)

`pnpm generate` emits static files in `.output/public/` — no Node.js process at runtime. Any static host needs an **SPA rewrite of every non-asset path to `/index.html` with status `200`**, otherwise a deep link (`/admin/tournaments/42`, `/en/public/...`) 404s on refresh, since `nuxt generate` produces nothing for dynamic routes. The security headers and CSP that Docker gets from Nitro are **not** present in a static build — they must be replicated in the host's own configuration if needed.

### CI

[`.github/workflows/`](.github/workflows/) builds and publishes the Docker image:

- **`ghcr-publish.yml`** — the live pipeline. Triggers on a published release (plus manual dispatch); tags `latest` plus a normalised release title.
- **`docker-publish.yml`** — a Docker Hub twin, disabled by default (manual dispatch only).

Both pass the six build-time variables as `--build-arg` from repository variables/secrets.

## Documentation

[`CLAUDE.md`](CLAUDE.md) is the deepest written reference in this repo: it documents the runtime API override, the admin CRUD recipe, the realtime pattern, the match-board auto-scroll, and the security headers/CSP setup.
