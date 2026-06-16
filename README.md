<p align="center">
  <img src="app/assets/logo.png" alt="matches-dashboard logo" height="80" />
</p>

<h1 align="center">matches-dashboard</h1>

<p align="center">Frontend for an amateur combat-sports tournament management platform.</p>

<p align="center">
  <a href="https://nuxt.com"><img src="https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt.js&logoColor=white" alt="Nuxt 4" /></a>
  <a href="https://vuejs.org"><img src="https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js&logoColor=white" alt="Vue 3" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" /></a>
  <a href="https://pnpm.io"><img src="https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white" alt="pnpm" /></a>
</p>

---

A single Nuxt 4 application serving two audiences: **administrators** managing tournaments and match data, and **public users** (athletes and spectators) registering for events and following live results.

> [!NOTE]
> This is a thin SPA client. All persistence, business rules, and authentication live in a separate **Laravel API**. This repo only renders UI, validates input, and talks HTTP + WebSocket. Because the app runs with `ssr: false`, it builds to static files with no Node.js server at runtime.

## Features

- **Admin panel** — manage athletes, tournaments, disciplines, weight categories, and users; review and approve registrations; build the match grid and update scores
- **Public registration form** — unauthenticated athlete entry flow for open tournaments
- **Live scoreboard** — Laravel Echo + Reverb with a *notify-then-refetch* pattern that keeps REST as the single source of truth
- **Match board** — a dedicated grid view of bouts for a selected tournament
- **Bilingual** — Italian (default, no URL prefix) and English under `/en/…`
- **Light / dark mode** — follows OS preference, with a manual override
- **Runtime theming** — admins pick a primary color that persists to a cookie
- **Fully typed** — TypeScript end-to-end with Zod-validated forms

## Tech stack

| Layer             | Technology                                                            |
| ----------------- | --------------------------------------------------------------------- |
| Framework         | [Nuxt 4](https://nuxt.com) (`ssr: false` — static SPA output)         |
| Component library | [@nuxt/ui v4](https://ui.nuxt.com) — 125+ accessible Vue components   |
| Styling           | [Tailwind CSS v4](https://tailwindcss.com)                            |
| Auth              | [nuxt-auth-sanctum](https://github.com/manchenkoff/nuxt-auth-sanctum) (Laravel Sanctum, token mode) |
| Realtime          | [Laravel Echo](https://laravel.com/docs/broadcasting) + Reverb (via [pusher-js](https://github.com/pusher/pusher-js-protocol)) |
| i18n              | [@nuxtjs/i18n](https://i18n.nuxtjs.org)                               |
| Form validation   | [Zod v4](https://zod.dev)                                             |
| Package manager   | [pnpm](https://pnpm.io)                                               |
| Backend           | Laravel API (separate repository)                                     |

## Architecture

```
Browser (Nuxt SPA)  ──REST + Sanctum token──►  Laravel API  ──►  Database
        │                                            ▲
        └──────WebSocket (Echo / Reverb)─────────────┘
```

The app splits into two route namespaces:

| Namespace | URL prefix            | Auth                          | Purpose                                  |
| --------- | --------------------- | ----------------------------- | ---------------------------------------- |
| Admin     | `/admin/**`, `/login` | Sanctum token (cookie)        | Full tournament management               |
| Public    | `/public/**`          | none                          | Athlete registration and live scoreboard |

Sanctum's global middleware protects every route by default; public pages opt out with `definePageMeta({ sanctum: { excluded: true } })`. Root `/` redirects authenticated users to `/admin`, everyone else to `/login`.

### Key composables

- **`useApi()`** — wraps the Sanctum HTTP client, adding `Accept-Language`. Exposes `get`, `post`, `put`, `del`, `download`.
- **`useAuth()`** — thin wrapper over Sanctum auth; exposes `user`, `isAuthenticated`, `login`, `logout`, `fetchUser`.
- **`useEcho()` / `useTournamentMatchRecords()`** — subscribe to the live scoreboard channel and surface the last broadcast event.
- **`useColorPreference()`** — applies and persists the admin-chosen primary color.

### Admin CRUD pattern

Every admin resource page composes three reusable building blocks:

1. **`DataTable`** — generic paginated table driven by a `url` + `columns` prop. Consumes Laravel pagination (`{ data, meta }`), supports search and filters, and exposes `refresh()`.
2. **`*FormPanel`** — a slideover with a Zod-validated form for create/edit; emits `saved`/`closed` so the parent can refresh.
3. **`ApiSelectMenu`** — searchable popover that fetches related-resource options from an endpoint.

## Getting started

### Prerequisites

- Node.js 20+
- pnpm
- The Laravel API running (defaults to `http://localhost:8081`), with Reverb available for realtime features

### Install and run

```bash
make setup   # install deps and create .env from .env.example
make dev     # dev server at http://localhost:3000 (localhost only)
```

Or without `make`:

```bash
pnpm install
pnpm dev
```

To target a backend on a different port:

```bash
NUXT_PUBLIC_API_BASE=http://localhost:9090 pnpm dev
```

> [!IMPORTANT]
> All `NUXT_PUBLIC_*` variables are baked into the bundle **at build time**, not read at runtime (a consequence of `ssr: false`). Set them before running `pnpm build` or `docker build`.

## Configuration

| Variable                    | Default                 | Purpose                          |
| --------------------------- | ----------------------- | -------------------------------- |
| `NUXT_PUBLIC_API_BASE`      | `http://localhost:8081` | Laravel API base URL             |
| `NUXT_PUBLIC_REVERB_APP_KEY`| —                       | Laravel Reverb app key           |
| `NUXT_PUBLIC_REVERB_HOST`   | `localhost`             | Reverb WebSocket host            |
| `NUXT_PUBLIC_REVERB_PORT`   | `8080`                  | Reverb WebSocket port            |
| `NUXT_PUBLIC_REVERB_SCHEME` | `http`                  | `http` or `https`                |

## Routes

| URL                                       | Audience | Description                                     |
| ----------------------------------------- | -------- | ----------------------------------------------- |
| `/login`                                  | Admin    | Sign-in page                                    |
| `/admin`                                  | Admin    | Dashboard home                                  |
| `/admin/configurations/athletes`          | Admin    | Manage athletes                                 |
| `/admin/configurations/disciplines`       | Admin    | Manage disciplines                              |
| `/admin/configurations/weight_categories` | Admin    | Manage weight categories                        |
| `/admin/configurations/users`             | Admin    | Manage admin users                              |
| `/admin/tournaments`                      | Admin    | Manage tournaments                              |
| `/admin/tournaments/registrations`        | Admin    | Review and approve registrations                |
| `/admin/tournaments/match_records`        | Admin    | Build and update the match grid                 |
| `/admin/tournaments/match_records/board`  | Admin    | Match board view                                |
| `/admin/settings`                         | Admin    | Theme color and locale preferences              |
| `/public/athletes/registration`           | Public   | Athlete registration form                       |
| `/public/tournaments/match_records`       | Public   | Live scoreboard with realtime updates           |

## Domain model

| Entity              | Description                                                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Tournament**      | A scheduled event. Status flow: `scheduled` → `registrations_opened` → `registrations_closed` → `in_progress` → `completed` (or `cancelled`). |
| **Athlete**         | A person record, identified by Italian tax number (codice fiscale).                                                                |
| **Registration**    | An athlete's entry into a tournament with a discipline and weight category, reviewed by an admin.                                   |
| **Match record**    | A single bout between two athletes — tracks corners, judge scores, end method, and winner.                                          |
| **Discipline**      | A fighting style.                                                                                                                   |
| **Weight category** | A weight bracket.                                                                                                                   |

Backend enum values (`TOURNAMENT_STATUSES`, `MATCH_STATUSES`, `END_METHODS`, `GENDERS`) are mirrored as `as const` arrays in [`app/utils/constants.ts`](app/utils/constants.ts). The full schema lives in [`DB.md`](DB.md) (DBML).

## Realtime scoreboard

The public scoreboard at `/public/tournaments/match_records` uses a **notify-then-refetch** pattern over Laravel Echo + Reverb:

1. On tournament selection, the client subscribes to the public channel `tournaments.{id}.match_records`.
2. When the server broadcasts a `.MatchRecordChanged` event with `refresh: true`, the client discards the payload and issues a fresh `GET` for the full match list.
3. On deselection or unmount, the channel is left and the socket is torn down.

This keeps REST as the single source of truth and avoids WebSocket payload drift.

## Project structure

```
app/
├── components/       # Shared components (DataTable, *FormPanel, ApiSelectMenu, MatchRecord*, …)
├── composables/      # useApi, useAuth, useEcho, useTournamentMatchRecords, useColorPreference
├── layouts/          # default.vue — collapsible sidebar shell for admin pages
├── pages/
│   ├── admin/        # Authenticated pages (configurations, tournaments, settings)
│   └── public/       # Registration form and live scoreboard
├── plugins/          # echo.client.ts (Reverb), auth.ts, color-preference.client.ts
└── utils/            # constants.ts — domain enums and theme palette
i18n/locales/         # it.json (default), en.json — kept in sync
docs/                 # In-depth developer documentation (EN + IT)
```

## Scripts

| Command               | Description                                     |
| --------------------- | ----------------------------------------------- |
| `pnpm dev`            | Start the dev server at `http://localhost:3000` |
| `pnpm build`          | Production build → `.output/public/` (static)   |
| `pnpm preview`        | Serve the built output locally                  |
| `pnpm eslint . --fix` | Lint and auto-fix                               |
| `pnpm nuxi typecheck` | Type-check the project                          |

`make help` lists all available Makefile targets.

> [!TIP]
> Run `pnpm eslint . --fix` after every coding session. The repo enforces `@antfu/eslint-config` (single quotes, no semicolons, sorted imports).

## Deployment

`pnpm build` produces a **static site** in `.output/public/` — no Node.js server required at runtime. The recommended path is the included Docker image:

```bash
docker build \
  --build-arg NUXT_PUBLIC_API_BASE=https://api.example.com \
  -t matches-dashboard .

docker run -p 80:80 matches-dashboard
```

The multi-stage `Dockerfile` builds the app with Node 22, then serves the static output from `nginx:alpine`. The bundled `nginx.conf` handles SPA routing (`try_files … /index.html`) so deep links resolve after a hard refresh.

> [!IMPORTANT]
> The Laravel API and the Reverb WebSocket endpoint must both be reachable **from the browser** at the configured `NUXT_PUBLIC_*` addresses for live features to work.

## Documentation

In-depth developer documentation lives under [`docs/en/`](docs/en/00-index.md) and [`docs/it/`](docs/it/00-index.md), covering the tech stack, project structure, authentication, the admin CRUD pattern, data flow, the realtime scoreboard, the domain model, and i18n/theming.
