<p align="center">
  <img src="app/assets/logo.png" alt="matches-dashboard logo" height="80" />
</p>

<h1 align="center">matches-dashboard</h1>

<p align="center">Frontend for an amateur boxing tournament management platform.</p>

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
> This is a thin client. All persistence, business rules, and authentication live in a separate Spring Boot API. This repo only renders UI, validates input, and talks HTTP + WebSocket.

## Features

- **Admin panel** — manage athletes, tournaments, disciplines, weight categories, and users; approve registrations; build the match grid and update scores
- **Public registration wizard** — multi-step flow keyed off Italian tax number (codice fiscale)
- **Live scoreboard** — STOMP-over-WebSocket with notify-then-refetch and auto-scroll to the active bout
- **Bilingual** — Italian (default) and English with locale-prefixed URLs (`/en/…`)
- **Light / dark mode** — follows OS preference, with a manual override on the Settings page
- **Fully typed** — TypeScript end-to-end with Zod-validated forms

## Tech stack

| Layer             | Technology                                                          |
| ----------------- | ------------------------------------------------------------------- |
| Framework         | [Nuxt 4](https://nuxt.com) (`ssr: false` — static SPA output)       |
| Component library | [@nuxt/ui v4](https://ui.nuxt.com) — 125+ accessible Vue components |
| Styling           | [Tailwind CSS v4](https://tailwindcss.com)                          |
| Realtime          | [@stomp/stompjs](https://stomp-js.github.io) over WebSocket         |
| i18n              | [@nuxtjs/i18n](https://i18n.nuxtjs.org)                             |
| Form validation   | [Zod v4](https://zod.dev)                                           |
| Package manager   | [pnpm](https://pnpm.io)                                             |
| Backend           | Spring Boot API (separate repository)                               |

## Architecture

```
Browser (Nuxt SPA)  ──REST + JWT──►  Spring Boot API  ──►  Database
        │                                   ▲
        └──────STOMP / WebSocket────────────┘
```

The app splits into two route namespaces:

| Namespace | URL prefix            | Auth               | Purpose                                  |
| --------- | --------------------- | ------------------ | ---------------------------------------- |
| Admin     | `/admin/**`, `/login` | JWT (localStorage) | Full tournament management               |
| Public    | `/public/**`          | none               | Athlete registration and live scoreboard |

Root `/` redirects authenticated users to `/admin`, everyone else to `/login`.

## Getting started

### Prerequisites

- Node.js 20+
- pnpm
- The Spring Boot API running (defaults to `http://localhost:8081`)

### Install and run

```bash
make setup   # installs deps and copies .env.example → .env
make dev     # dev server at http://localhost:3000
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
> `NUXT_PUBLIC_API_BASE` is baked into the bundle **at build time**, not read at runtime. Set it before running `pnpm build` or `docker build`.

## Routes

| URL                                | Audience | Description                                     |
| ---------------------------------- | -------- | ----------------------------------------------- |
| `/login`                           | Admin    | Sign-in page                                    |
| `/admin`                           | Admin    | Dashboard home                                  |
| `/admin/configurations/*`          | Admin    | Athletes, weight categories, disciplines, users |
| `/admin/tournaments`               | Admin    | Manage tournaments                              |
| `/admin/tournaments/registrations` | Admin    | Review and approve registrations                |
| `/admin/tournaments/matches`       | Admin    | Build and update the match grid                 |
| `/admin/tournaments/matches/board` | Admin    | Full-screen match board view                    |
| `/admin/settings`                  | Admin    | Theme color and locale preferences              |
| `/public/athletes/registration`    | Public   | Multi-step registration wizard                  |
| `/public/tournaments/matches`      | Public   | Live scoreboard with realtime updates           |

## Configuration

One environment variable controls the entire integration:

| Variable               | Default                 | Purpose                                                                                         |
| ---------------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| `NUXT_PUBLIC_API_BASE` | `http://localhost:8081` | HTTP origin of the Spring Boot API. The WebSocket URL is derived from it (`http://` → `ws://`). |

Copy `.env.example` to `.env` for local development (`make setup` does this automatically).

## Domain model

| Entity              | Description                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Tournament**      | A scheduled event (city, date). Status flow: `SCHEDULED` → `REGISTRATIONS_OPENED` → `IN_PROGRESS` → `COMPLETED`.                     |
| **Athlete**         | A person record, uniquely identified by Italian tax number (codice fiscale).                                                         |
| **Registration**    | An athlete's entry into a tournament with a discipline and weight category. Starts `TO_MANAGE`, moves to `VALID` after admin review. |
| **Match**           | A single bout between two athletes. Tracks corners, judge scores, end method, and winner.                                            |
| **Discipline**      | A fighting style (e.g. Light contact, Full contact).                                                                                 |
| **Weight category** | An upper-bound weight bracket (e.g. 60 kg, 75 kg).                                                                                   |

Full schema in [`DB.md`](DB.md) (DBML).

## Realtime scoreboard

The public scoreboard at `/public/tournaments/matches` uses a **notify-then-refetch** pattern:

1. On tournament selection, the client connects to `<apiBase>/ws` via STOMP and subscribes to `/topic/tournaments/{id}/matches`.
2. When the server publishes an update, the client discards the message body and issues a fresh `GET` for the full match list.
3. On deselection or unmount, the socket is torn down immediately.

This keeps REST as the single source of truth and avoids WebSocket payload drift.

## Project structure

```
app/
├── components/       # Shared components (DataTable, *FormPanel, MatchCardReadOnly, …)
├── composables/      # useApi, useAuth, useColorPreference
├── layouts/          # default.vue — sidebar shell for all admin pages
├── middleware/       # auth.global.ts — whitelists public paths, redirects otherwise
├── pages/
│   ├── admin/        # Authenticated pages (configurations, tournaments, settings)
│   └── public/       # Registration wizard and live scoreboard
└── plugins/          # auth.client.ts — restores auth state from localStorage on boot
i18n/locales/         # en.json, it.json
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
> Always run `pnpm eslint . --fix` after a coding session. The repo enforces `@antfu/eslint-config` (single quotes, no semicolons, sorted imports).

## Deployment

`pnpm build` produces a **static site** in `.output/public/` — no Node.js server required at runtime. The recommended deployment path is the included Docker image:

```bash
docker build \
  --build-arg NUXT_PUBLIC_API_BASE=https://api.example.com \
  -t matches-dashboard .

docker run -p 80:80 matches-dashboard
```

The multi-stage `Dockerfile` builds the app with Node 22, then copies the static output into `nginx:alpine`. The bundled `nginx.conf` handles SPA routing (`try_files … /index.html`) so deep links resolve correctly after a hard refresh.

> [!IMPORTANT]
> The backend API must be reachable **from the browser** at `NUXT_PUBLIC_API_BASE`. The WebSocket endpoint at `<base>/ws` must also be publicly accessible for the live scoreboard to function.

## Documentation

In-depth developer documentation lives under [`docs/en/`](docs/en/00-index.md) and [`docs/it/`](docs/it/00-index.md).

| Chapter                                                           | Topic                                                |
| ----------------------------------------------------------------- | ---------------------------------------------------- |
| [01 — Overview](docs/en/01-overview.md)                           | What the app is, who uses it, the admin/public split |
| [02 — Module structure](docs/en/02-module-structure.md)           | Directory layout and how pieces fit together         |
| [03 — Build, run, test](docs/en/03-build-run-test.md)             | Commands, conventions, Docker                        |
| [04 — UI & navigation](docs/en/04-ui-navigation.md)               | File-based routing, layouts, route middleware        |
| [05 — Data flow](docs/en/05-data-flow.md)                         | How data moves between pages, composables, and API   |
| [06 — External integrations](docs/en/06-external-integrations.md) | useApi, WebSocket, auth plugin                       |
| [07 — Domain models](docs/en/07-domain-models.md)                 | Entity interfaces, enums, Zod schemas                |
| [08 — Configuration & env](docs/en/08-configuration-env.md)       | Build-time config, app.config, localStorage          |
| [10 — Notable patterns](docs/en/10-notable-patterns.md)           | DataTable + slideover CRUD, notify-then-refetch      |
