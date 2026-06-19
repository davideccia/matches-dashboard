# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

The `Makefile` is the canonical entrypoint (`make help` lists all targets):

```bash
make setup            # install deps + create .env from .env.example
make dev              # dev server on localhost only → http://localhost:3000
make host             # dev server exposed on 0.0.0.0 (LAN / Docker)
make build            # production build → .output/public/ (static, ssr: false)
make preview          # serve the build locally
make lint-fix         # ESLint + auto-fix
make typecheck        # nuxi typecheck
make docker-build     # buildx multi-arch image, pushed to the registry in the Makefile
make release V=1.2.3  # bump package.json version, commit, tag (PUSH=1 to push)
```

The underlying scripts also work directly: `pnpm dev`, `pnpm build`, `pnpm eslint . --fix`, `pnpm nuxi typecheck`.

**There is no automated test suite** (no test runner or test files in the repo). Verify changes via `make typecheck`, `make lint-fix`, and manual runs.

All env vars are baked into the bundle at **build time** (not read at runtime) because `ssr: false`:

| Variable                     | Default                 | Purpose                |
| ---------------------------- | ----------------------- | ---------------------- |
| `NUXT_PUBLIC_API_BASE`       | `http://localhost:8081` | Laravel API base URL   |
| `NUXT_PUBLIC_REVERB_APP_KEY` | —                       | Laravel Reverb app key |
| `NUXT_PUBLIC_REVERB_HOST`    | `localhost`             | Reverb WebSocket host  |
| `NUXT_PUBLIC_REVERB_PORT`    | `8080`                  | Reverb WebSocket port  |
| `NUXT_PUBLIC_REVERB_SCHEME`  | `http`                  | `http` or `https`      |

`NUXT_PUBLIC_API_BASE` is reused as Sanctum's `baseUrl`. For Docker, pass it as a `--build-arg` (see Container below).

## Architecture

**Thin SPA client.** `ssr: false` — Nuxt builds static files only (no Node server). All business logic, persistence, and auth live in a separate **Laravel API** ([repo](https://codeberg.org/davideccia/matches-api-laravel)). This frontend renders UI, validates input with Zod, and talks HTTP + WebSocket.

### Two audiences, one app

- **Admin** (`/admin/**`, `/login`) — authenticated via Sanctum token (stored in a cookie by `nuxt-auth-sanctum`). Protected by Sanctum's global middleware (`sanctum.globalMiddleware.enabled: true`), so **every route is protected by default**.
- **Public** (`/public/**`) — unauthenticated. Pages must opt out with `definePageMeta({ sanctum: { excluded: true } })`. `/login` uses `sanctum: { guestOnly: true }`.

The root `/` always redirects to `/admin` (via `localePath`); the middleware then bounces unauthenticated users to `/login`.

### Key composables

- **`useApi()`** — wraps `useSanctumClient()` to add `Accept-Language`. Returns `get`, `post`, `put`, `del`, `upload`, `download`. All admin pages use this. Two things to know: `download()` **bypasses** the Sanctum client (uses `$fetch` with a blob response, reading the token manually from the `sanctum.token.cookie`); and the exported `getApiErrorMessage(e)` extracts the backend's error message and is used in every `catch` block to feed a toast.
- **`useAuth()`** — wraps `useSanctumAuth<{ data: User }>()`, unwrapping `{ data }` to expose `user`. Exposes `isAuthenticated`, `login`, `logout`, `fetchUser`. `plugins/auth.ts` hooks `sanctum:logout` → `useUser().clear()` (which calls `refreshNuxtData()`).

### Admin CRUD pattern

Every admin resource page is the same recipe — read `DataTable.vue` + any `*FormPanel.vue` + `ApiSelectMenu.vue` once and the rest follow:

1. **`DataTable`** — generic (`generic="T">`) paginated table; takes `url` + `columns`, fetches Laravel `{ data, meta }` via `useLazyAsyncData`, exposes `refresh()` through `defineExpose`. Debounced search (300 ms), `searchable`, `params` (deep-watched, resets to page 1), and a `#filters` slot. Page-defined slots named `<column>-cell` pass through to `UTable`.
2. **`*FormPanel`** — a `USlideover` with a Zod-validated `UForm`. `open` is a `defineModel`; `item === null` ⇒ create, otherwise edit (a `watch(open)` does a `GET /{id}` to populate fresh state). Emits `saved`; the parent calls `dataTable.refresh()`.
3. **`ApiSelectMenu`** — searchable popover that fetches options from an endpoint, with debounced server-side search and `IntersectionObserver`-based infinite scroll. Integrates with `UForm` via `useFormField()`.

Panels live in `components/panels/` and are auto-registered **without** a path prefix (`nuxt.config.ts` → `components`), so use `<AthleteFormPanel>` not `<PanelsAthleteFormPanel>`. Wrap panels/modals in `<ClientOnly>`.

### Realtime scoreboard (notify-then-refetch)

`/public/tournaments/match_records` uses **Laravel Echo + Reverb**, never sending domain data over the socket:

- `plugins/echo.client.ts` initialises Echo (`broadcaster: 'reverb'`) from the `NUXT_PUBLIC_REVERB_*` vars; `useEcho()` exposes it.
- `useTournamentMatchRecords(tournamentId)` takes a **Ref**, subscribes to `tournaments.{id}.match_records`, listens for `.MatchRecordChanged`, and returns `lastEvent`. It always `unsubscribe()`s before re-subscribing on tournament change and on `onUnmounted`.
- The page watches `lastEvent`; when `event.refresh` is true it calls the REST `refresh()`. REST stays the single source of truth.

### Match board auto-scroll ("seek")

Both `admin/.../match_records/board.vue` and the public scoreboard auto-scroll to the active bout. Each card registers its DOM node into an index-aligned `matchCardEls` array via a function ref; a `watch` on the items does `await nextTick()` (the DOM isn't ready otherwise) then `scrollIntoView` to the first `in_progress` match, falling back to the first `scheduled`. The admin board gates this with a `hasScrolledInitially` flag (scroll once, re-armed on tournament change / refresh); the public board deliberately omits the flag so it re-centers on every WebSocket-driven refresh.

### i18n

Italian (`it`) is the default locale (no URL prefix); English uses `/en/`. Keys live in `i18n/locales/it.json` and `en.json` — **both files must be kept in sync for every new string**. `useApi` forwards the active locale as `Accept-Language` so the backend localises its messages.

### Domain enums & models

Backend enum values (`TOURNAMENT_STATUSES`, `MATCH_STATUSES`, `END_METHODS`, `GENDERS`, `CLIENT_TYPES`) are typed as `as const` arrays in `app/utils/constants.ts` — import from there instead of hardcoding strings. Domain interfaces are in `app/types/models.ts`; relations (e.g. `red_corner?`, `tournament?`) are optional and present only when the request includes `?with=...` (Laravel eager loading). The authoritative DB schema is `DB.md` (DBML).

### Theming

`app/app.config.ts` sets `@nuxt/ui` color tokens. The primary color is changeable at runtime from Settings; it persists to the `ui-primary-color` cookie and is reapplied on boot by `plugins/color-preference.client.ts`. `COLOR_PALETTE` and `COLOR_SECONDARY_MAP` in `constants.ts` define valid choices.

## Container

`Dockerfile` is multi-stage: Node 22 build → `nginx:alpine` serving `.output/public/` (with a healthcheck). `nginx.conf` handles SPA routing (`try_files … /index.html`). Pass the API URL as a build arg (build-time only):

```bash
docker build --build-arg NUXT_PUBLIC_API_BASE=https://api.example.com -t matches-dashboard .
```

## Further docs

In-depth chapter docs live in `docs/en/` and `docs/it/` (start at `00-index.md`).

## End of session

After every code session run `make lint-fix` (or `pnpm eslint . --fix`) and report any remaining non-auto-fixable errors to the user.
