# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Dev server at http://localhost:3000
pnpm build            # Production build → .output/public/ (static, ssr: false)
pnpm preview          # Serve the build locally
pnpm eslint . --fix   # Lint + auto-fix (run after every code session)
pnpm nuxi typecheck   # Type-check
```

Set `NUXT_PUBLIC_API_BASE` to point at a non-default backend (default: `http://localhost:8081`). With `ssr: false` this value is baked into the bundle at **build time**, not read at runtime.

## Architecture

**Thin SPA client.** `ssr: false` — Nuxt builds static files only (no Node server). All business logic, persistence, and auth live in a separate Spring Boot API.

### Two audiences, one app

- **Admin** (`/admin/**`, `/login`) — authenticated via JWT stored in `localStorage`. Protected by `auth.global.ts` middleware.
- **Public** (`/public/**`) — unauthenticated. Registration wizard and live scoreboard.

The root `/` redirects: authenticated → `/admin`, otherwise → `/login`.

### Key composables

- **`useApi()`** — thin wrapper around `$fetch` that injects the `Authorization: Bearer` header from `useState('auth-token')`. Returns `get`, `post`, `put`, `del`, `download`. All admin pages use this.
- **`useAuth()`** — manages JWT + user in `localStorage` via `useState`. Exposes `login`, `logout`, `fetchUser`, `isAuthenticated`. The `plugins/auth.client.ts` plugin calls `fetchUser()` on app boot to rehydrate state.

### Admin CRUD pattern

Every admin resource page follows the same recipe:

1. **`DataTable`** component — generic, takes a `url` + `columns` prop. Fetches paginated Spring Boot Page responses (`{ data: { content: T[], totalElements: number } }`) via `useLazyAsyncData`. Exposes `refresh()` via `defineExpose`.
2. **`*FormPanel`** component (e.g. `AthleteFormPanel`) — a `USlideover` with a Zod-validated form. Receives an optional item for edit mode, emits `saved`/`closed`. The parent page listens to `saved` and calls `dataTable.refresh()`.

### Realtime scoreboard

`/public/tournaments/matches` uses **notify-then-refetch**: connects to `<apiBase>/ws` via STOMP, subscribes to `/topic/tournaments/{id}/matches`, and on any message issues a fresh REST `GET` (ignores the message body). Socket is torn down on tournament deselection or component unmount.

WebSocket URL is derived from `NUXT_PUBLIC_API_BASE` by replacing `http://` with `ws://`.

### i18n

Italian (`it`) is the default locale (no URL prefix). English uses `/en/` prefix. Translation keys live in `i18n/locales/it.json` and `en.json`. Both files must be kept in sync for every new string.

### Domain enums

All backend enum values (`TOURNAMENT_STATUSES`, `MATCH_STATUSES`, `END_METHODS`, `REGISTRATION_STATUSES`, `GENDERS`) are typed as `as const` arrays in `app/utils/constants.ts`. Import from there instead of hardcoding strings.

### Theming

`app/app.config.ts` sets `@nuxt/ui` color tokens. Primary color can be changed at runtime by the user from the Settings page; it persists to a cookie (`ui-primary-color`) and applies via `useColorPreference`. The `COLOR_PALETTE` and `COLOR_SECONDARY_MAP` constants in `constants.ts` define valid choices.

## Container

`Dockerfile` is multi-stage: Node build → `nginx:alpine` serving `.output/public/`. The `nginx.conf` handles SPA routing (`try_files … /index.html`). Pass the API URL as a build arg:

```bash
docker build --build-arg NUXT_PUBLIC_API_BASE=https://api.example.com -t matches-dashboard .
```

## End of session

After every code session run:

```bash
pnpm eslint . --fix
```

Report any remaining non-auto-fixable errors to the user.
