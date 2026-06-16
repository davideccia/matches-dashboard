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

All env vars are baked into the bundle at **build time** (not read at runtime) because `ssr: false`:

| Variable | Default | Purpose |
|---|---|---|
| `NUXT_PUBLIC_API_BASE` | `http://localhost:8081` | Laravel API base URL |
| `NUXT_PUBLIC_REVERB_APP_KEY` | — | Laravel Reverb app key |
| `NUXT_PUBLIC_REVERB_HOST` | `localhost` | Reverb WebSocket host |
| `NUXT_PUBLIC_REVERB_PORT` | `8080` | Reverb WebSocket port |
| `NUXT_PUBLIC_REVERB_SCHEME` | `http` | `http` or `https` |

## Architecture

**Thin SPA client.** `ssr: false` — Nuxt builds static files only (no Node server). All business logic, persistence, and auth live in a separate Laravel API.

### Two audiences, one app

- **Admin** (`/admin/**`, `/login`) — authenticated via Sanctum token (stored in a cookie by `nuxt-auth-sanctum`). Protected by Sanctum's global middleware (`sanctum.globalMiddleware.enabled: true`).
- **Public** (`/public/**`) — unauthenticated. Pages must set `definePageMeta({ sanctum: { excluded: true } })`.

The root `/` redirects: authenticated → `/admin`, otherwise → `/login`.

### Key composables

- **`useApi()`** — wraps `useSanctumClient()` (from `nuxt-auth-sanctum`) to add `Accept-Language` headers. Returns `get`, `post`, `put`, `del`, `download`. All admin pages use this.
- **`useAuth()`** — thin wrapper around `useSanctumAuth<User>()`. Exposes `user`, `isAuthenticated`, `login`, `logout`, `fetchUser`. Auth state is managed by Sanctum; the `plugins/auth.ts` plugin hooks into `sanctum:logout` to clear local state.

### Admin CRUD pattern

Every admin resource page follows the same recipe:

1. **`DataTable`** component — generic, takes a `url` + `columns` prop. Fetches paginated Laravel responses (`{ data: T[], meta: { total, current_page, last_page, per_page } }`) via `useLazyAsyncData`. Exposes `refresh()` via `defineExpose`. Supports `searchable`, `params`, and a `#filters` slot.
2. **`*FormPanel`** component (e.g. `AthleteFormPanel`) — a `USlideover` with a Zod-validated form. Receives an optional item for edit mode, emits `saved`/`closed`. The parent page listens to `saved` and calls `dataTable.refresh()`.
3. **`ApiSelectMenu`** component — searchable popover that fetches options from an API endpoint. Used in forms where the user selects a related resource (athlete, discipline, etc.).

### Realtime scoreboard

`/public/tournaments/match_records` uses **notify-then-refetch** via **Laravel Echo + Reverb**:

- `plugins/echo.client.ts` initialises a Laravel Echo instance with `broadcaster: 'reverb'` using the `NUXT_PUBLIC_REVERB_*` env vars.
- `useEcho()` composable exposes the Echo instance.
- `useTournamentMatchRecords(tournamentId)` subscribes to the public channel `tournaments.{id}.match_records` and listens for `.MatchRecordChanged` events. Returns `lastEvent`.
- The page watches `lastEvent` and calls `refreshMatchRecords()` when `event.refresh` is true. Socket is torn down on tournament deselection or component unmount.

### i18n

Italian (`it`) is the default locale (no URL prefix). English uses `/en/` prefix. Translation keys live in `i18n/locales/it.json` and `en.json`. Both files must be kept in sync for every new string.

### Domain enums

All backend enum values (`TOURNAMENT_STATUSES`, `MATCH_STATUSES`, `END_METHODS`, `GENDERS`) are typed as `as const` arrays in `app/utils/constants.ts`. Import from there instead of hardcoding strings.

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
