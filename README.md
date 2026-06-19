<div align="center">

<img src="app/assets/logo.png" alt="matches-dashboard logo" height="96" />

# Matches Dashboard [(Laravel Backend)](https://codeberg.org/davideccia/matches-api-laravel)

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
> This is a **thin SPA client**. All persistence, business rules, and authentication live in a separate [**Laravel API**](https://codeberg.org/davideccia/matches-api-laravel). This repo only renders the UI, validates input, and talks HTTP + WebSocket. Because the app runs with `ssr: false`, it builds to static files with **no Node.js server at runtime**.

## Features

- **Admin panel** — full CRUD over athletes, tournaments, disciplines, weight categories, and users; review and approve registrations; build the match grid and update judge scores.
- **Live scoreboard** — Laravel Echo + Reverb with a _notify-then-refetch_ pattern that keeps REST as the single source of truth.
- **Match board** — a grid view of a tournament's bouts that auto-scrolls to the active (or next scheduled) match.
- **Public registration** — an unauthenticated athlete sign-up flow for open tournaments.
- **Bilingual** — Italian (default, no URL prefix) and English under `/en/`.
- **Runtime theming** — admins pick a primary colour that persists to a cookie, plus light/dark mode following the OS preference.
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

Sanctum's global middleware protects every route by default; public pages opt out with `definePageMeta({ sanctum: { excluded: true } })`. The root `/` redirects to `/admin`, where the middleware sends unauthenticated users to `/login`.

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

- [Node.js](https://nodejs.org) 20+ and [pnpm](https://pnpm.io)
- The Laravel API running (defaults to `http://localhost:8081`), with [Reverb](https://reverb.laravel.com) available for realtime features

### Install and run

```bash
make setup   # install dependencies and create .env from .env.example
make dev     # dev server at http://localhost:3000 (localhost only)
```

Or without `make`:

```bash
pnpm install
pnpm dev
```

To target a backend on a different host or port:

```bash
NUXT_PUBLIC_API_BASE=http://localhost:9090 pnpm dev
```

> [!IMPORTANT]
> All `NUXT_PUBLIC_*` variables are baked into the bundle **at build time**, not read at runtime (a consequence of `ssr: false`). Set them before running `pnpm build` or `docker build`; changing them afterwards requires a rebuild.

## Configuration

| Variable                     | Default                 | Purpose                |
| ---------------------------- | ----------------------- | ---------------------- |
| `NUXT_PUBLIC_API_BASE`       | `http://localhost:8081` | Laravel API base URL   |
| `NUXT_PUBLIC_REVERB_APP_KEY` | —                       | Laravel Reverb app key |
| `NUXT_PUBLIC_REVERB_HOST`    | `localhost`             | Reverb WebSocket host  |
| `NUXT_PUBLIC_REVERB_PORT`    | `8080`                  | Reverb WebSocket port  |
| `NUXT_PUBLIC_REVERB_SCHEME`  | `http`                  | `http` or `https`      |

## Routes

| URL                                       | Audience | Description                           |
| ----------------------------------------- | -------- | ------------------------------------- |
| `/login`                                  | Admin    | Sign-in page                          |
| `/admin`                                  | Admin    | Dashboard home                        |
| `/admin/configurations/athletes`          | Admin    | Manage athletes                       |
| `/admin/configurations/disciplines`       | Admin    | Manage disciplines                    |
| `/admin/configurations/weight_categories` | Admin    | Manage weight categories              |
| `/admin/configurations/users`             | Admin    | Manage admin users                    |
| `/admin/tournaments`                      | Admin    | Manage tournaments                    |
| `/admin/tournaments/registrations`        | Admin    | Review and approve registrations      |
| `/admin/tournaments/match_records`        | Admin    | Build and update the match grid       |
| `/admin/tournaments/match_records/board`  | Admin    | Match board view                      |
| `/admin/settings`                         | Admin    | Theme colour and locale preferences   |
| `/public/athletes/registration`           | Public   | Athlete registration form             |
| `/public/tournaments/match_records`       | Public   | Live scoreboard with realtime updates |

## Domain model

| Entity              | Description                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Tournament**      | A scheduled event. Status: `scheduled` → `registrations_opened` → `registrations_closed` → `in_progress` → `completed` (or `cancelled`). |
| **Athlete**         | A person record, identified by tax number.                                                                                               |
| **Registration**    | An athlete's entry into a tournament with a discipline and weight category, reviewed by an admin.                                        |
| **Match record**    | A single bout between two athletes — tracks corners, judge scores, end method, and winner.                                               |
| **Discipline**      | A fighting style (rounds, minutes per round).                                                                                            |
| **Weight category** | A weight bracket.                                                                                                                        |

Backend enum values (`TOURNAMENT_STATUSES`, `MATCH_STATUSES`, `END_METHODS`, `GENDERS`) are mirrored as `as const` arrays in [`app/utils/constants.ts`](app/utils/constants.ts). The full schema lives in [`DB.md`](DB.md) (DBML).

## Realtime scoreboard

The public scoreboard uses a **notify-then-refetch** pattern over Laravel Echo + Reverb:

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
├── types/            # models.ts — domain TypeScript interfaces
└── utils/            # constants.ts (enums + theme palette), date.ts
i18n/locales/         # it.json (default), en.json — kept in sync
docs/                 # In-depth developer documentation (en + it)
```

## Commands

Run `make help` to list all targets. The most common ones:

| Command             | Description                                                |
| ------------------- | ---------------------------------------------------------- |
| `make setup`        | Install dependencies and create `.env` from `.env.example` |
| `make dev`          | Dev server on `localhost` only                             |
| `make host`         | Dev server exposed on `0.0.0.0` (LAN / Docker)             |
| `make build`        | Production build → `.output/public/` (static)              |
| `make preview`      | Serve the built output locally                             |
| `make lint-fix`     | Run ESLint with auto-fix                                   |
| `make typecheck`    | Type-check via `nuxi`                                      |
| `make docker-build` | Build and push a multi-arch image                          |
| `make clean`        | Remove build artifacts and Nuxt cache                      |

> [!TIP]
> Run `make lint-fix` after every coding session. The repo enforces `@antfu/eslint-config` (single quotes, no semicolons, sorted imports).

## Deployment

`pnpm build` produces a **static site** in `.output/public/` — no Node.js server required at runtime. The recommended path is the included Docker image:

```bash
docker build \
  --build-arg NUXT_PUBLIC_API_BASE=https://api.example.com \
  -t matches-dashboard .

docker run -p 80:80 matches-dashboard
```

The multi-stage [`Dockerfile`](Dockerfile) builds the app with Node 22, then serves the static output from `nginx:alpine` (with a healthcheck). The bundled [`nginx.conf`](nginx.conf) handles SPA routing (`try_files … /index.html`) so deep links resolve after a hard refresh.

> [!IMPORTANT]
> The Laravel API and the Reverb WebSocket endpoint must both be reachable **from the browser** at the configured `NUXT_PUBLIC_*` addresses for live features to work.

## Documentation

In-depth developer documentation lives under [`docs/en/`](docs/en/00-index.md) and [`docs/it/`](docs/it/00-index.md), covering the tech stack, project structure, authentication, the admin CRUD pattern, data flow, the match board and its auto-scroll, the realtime scoreboard, the domain model, and i18n/theming. See also [`CLAUDE.md`](CLAUDE.md) for architecture notes and a command summary.
