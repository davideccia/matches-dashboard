# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

The `Makefile` is the canonical entrypoint (`make help` lists all targets):

```bash
make dev              # dev server, exposed on 0.0.0.0 (LAN) → http://localhost:3000
make lint             # ESLint (no auto-fix)
make lint-fix         # ESLint + auto-fix
make typecheck        # nuxi typecheck — CURRENTLY BROKEN, see below
make clean            # remove .nuxt .output dist
pnpm generate         # static SPA build → .output/public/
```

The underlying scripts also work directly: `pnpm dev`, `pnpm generate`, `pnpm eslint . --fix`, `pnpm nuxi typecheck`.

`make typecheck` **does not run**: `nuxi typecheck` shells out to an npx-installed `vue-tsc`, which fails to resolve the repo's TypeScript 6 (`ERR_PACKAGE_PATH_NOT_EXPORTED` from `resolveTscPath`) and exits 1 before type-checking anything. Don't read that failure as a type error in the code, and don't treat it as a gate you can satisfy — the only working checks are `make lint-fix` and running the app.

**There is no automated test suite** (no test runner, no test files, no test script). `.claude/rules/common/testing.md` describes an 80%-coverage TDD workflow that has no infrastructure behind it here; verify changes via `make lint-fix` and manual runs against a live API.

`README.md` was synced against the code on 2026-08-06 (commands, routes, config defaults, domain model, structure). When you change a route, a `make` target, or a `NUXT_PUBLIC_*` default, update it there too — and keep the `Makefile` and `nuxt.config.ts` as the tiebreakers if they ever drift again.

`NUXT_PUBLIC_*` values used by client-side code are baked into the bundle at **build time**:

| Variable                            | Default                  | Purpose                                                                                                       |
| ----------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `NUXT_PUBLIC_SANCTUM_BASE_URL`      | `https://api.matches.it` | Laravel API base URL                                                                                          |
| `NUXT_PUBLIC_REVERB_APP_KEY`        | —                        | Laravel Reverb app key                                                                                        |
| `NUXT_PUBLIC_REVERB_HOST`           | `localhost`              | Reverb WebSocket host                                                                                         |
| `NUXT_PUBLIC_REVERB_PORT`           | `8080`                   | Reverb WebSocket port                                                                                         |
| `NUXT_PUBLIC_REVERB_SCHEME`         | `http`                   | `http` or `https`                                                                                             |
| `NUXT_PUBLIC_ENV_SWITCHER_PASSWORD` | —                        | Plaintext password unlocking the API environment switcher from `/login`. **Empty ⇒ the gesture is disabled.** |

### Runtime override (`useApiConfig`)

Since the build is static there is no server to re-read env vars, so the API/Reverb config is resolved by **`app/composables/useApiConfig.ts`** with three tiers:

1. **override in `localStorage`** (key `matches.api-override`) — set at runtime, per browser;
2. the `NUXT_PUBLIC_*` values baked in at build time;
3. `API_ENDPOINTS[0]` in `app/utils/constants.ts` (`https://api.matches.it`).

`app/plugins/api-base-url.ts` hooks `sanctum:request` and rewrites `context.options.baseURL` on **every** request, so the Sanctum client (created once) still follows the override. The call sites that bypass that client — `useApi().download()` and the two `/public/**` pages — read `useApiConfig().config.value.baseUrl` directly. `plugins/echo.client.ts` reads the resolved Reverb values, which is why applying an override triggers a `location.reload()`: Echo opens its connection once at plugin init.

`ApiEnvironmentSwitcher.vue` covers `baseUrl` plus all four Reverb values, so the realtime scoreboard follows the environment. Switching invalidates the current token → 401 → back to `/login`. There is a single way in: **5 clicks on a logo** (within 1.5 s of each other) → password → switcher, via `ApiEnvironmentUnlock.vue`, which wraps the logo in a `<slot />`. Wired logos:

- **`/login`** — both the mobile strip and the desktop panel logo (only one is visible per breakpoint). This one matters because **a wrong base URL makes login impossible**, so the fix has to be reachable before authenticating.
- **`layouts/default.vue`** — the admin sidebar logo, for repointing while logged in.

The typed password is compared directly against `NUXT_PUBLIC_ENV_SWITCHER_PASSWORD`. It fails closed: with the variable empty the gesture does nothing at all.

**The password is obfuscation, not security.** It is a `NUXT_PUBLIC_*` value in a static bundle, so it is readable by anyone who looks — and in any case anyone can set the `matches.api-override` key in `localStorage` from the console and get the same result without the dialog. That's acceptable because it guards no data: the override only affects that browser, and the API still authenticates every request. Don't present it as an access control, and don't reuse a password that means anything elsewhere.

For a whole deploy, keep using the Amplify environment variables (build time — needs a redeploy). The `localStorage` override is the escape hatch for repointing an already-built bundle.

## Architecture

**Static SPA client for a separate API.** `ssr: false` — `pnpm generate` emits static files in `.output/public/`, no Node server at runtime. All business logic, persistence, and auth live in a separate **Laravel API** ([repo](https://codeberg.org/davideccia/matches-api-laravel)). This frontend renders UI, validates input with Zod, and talks HTTP + WebSocket.

### Two audiences, one app

- **Admin** (`/admin/**`, `/login`) — authenticated via Sanctum token (stored in a cookie by `nuxt-auth-sanctum`). Protected by Sanctum's global middleware (`sanctum.globalMiddleware.enabled: true`), so **every route is protected by default**.
- **Public** (`/public/**`) — unauthenticated. Pages must opt out with `definePageMeta({ sanctum: { excluded: true } })`. `/login` uses `sanctum: { guestOnly: true }`.

The root `/` is **not a redirect** — `app/pages/index.vue` is a landing page with three entry buttons (`/login`, `/public/athletes/registration`, `/public/tournaments/match_records`), using `layout: false` and `sanctum: { guestOnly: true }`. Because `sanctum.redirect.onGuestOnly` is `/admin`, an already-authenticated admin hitting `/` lands on `/admin` instead. `/forgot-password` and `/reset-password` are `guestOnly` too.

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

- `plugins/echo.client.ts` initialises Echo (`broadcaster: 'reverb'`) from the Reverb values resolved by `useApiConfig()`; `useEcho()` exposes it.
- `useTournamentMatchRecords(tournamentId)` takes a **Ref**, subscribes to `tournaments.{id}.match_records`, listens for `.MatchRecordChanged`, and returns `lastEvent`. It always `unsubscribe()`s before re-subscribing on tournament change and on `onUnmounted`.
- The page watches `lastEvent`; when `event.refresh` is true it calls the REST `refresh()`. REST stays the single source of truth.

### Match board auto-scroll ("seek")

Both `components/tournaments/TournamentsMatchesBoardTab.vue` (the admin board — there is no longer a standalone `match_records/board.vue` page) and the public scoreboard auto-scroll to the active bout. Each card registers its DOM node into an index-aligned `matchCardEls` array via a function ref; a `watch` on the items does `await nextTick()` (the DOM isn't ready otherwise) then `scrollIntoView` to the first `in_progress` match, falling back to the first `scheduled`. The admin board gates this with a `hasScrolledInitially` flag (scroll once, re-armed on tournament change / refresh); the public board deliberately omits the flag so it re-centers on every WebSocket-driven refresh.

### i18n

Italian (`it`) is the default locale (no URL prefix); English uses `/en/`. Keys live in `i18n/locales/it.json` and `en.json` — **both files must be kept in sync for every new string**. `useApi` forwards the active locale as `Accept-Language` so the backend localises its messages.

### Domain enums & models

Backend enum values (`TOURNAMENT_STATUSES`, `MATCH_STATUSES`, `END_METHODS`, `GENDERS`, `CLIENT_TYPES`) are typed as `as const` arrays in `app/utils/constants.ts` — import from there instead of hardcoding strings. Domain interfaces are in `app/types/models.ts`; relations (e.g. `red_corner?`, `tournament?`) are optional and present only when the request includes `?with=...` (Laravel eager loading). The authoritative DB schema is `DB.md` (DBML).

### Theming

`app/app.config.ts` sets `@nuxt/ui` color tokens. The primary color is changeable at runtime from Settings; it persists to the `ui-primary-color` cookie and is reapplied on boot by `plugins/color-preference.client.ts`. `COLOR_PALETTE` and `COLOR_SECONDARY_MAP` in `constants.ts` define valid choices.

## Deployment

**AWS Amplify Hosting**, static. `amplify.yml` at the repo root is the build spec (Node 22 + pnpm, artifacts from `.output/public`). Two things are configured in the Amplify console, not in this repo:

- the `NUXT_PUBLIC_*` environment variables (baked in at build time — a change needs a redeploy; for a one-off repoint without a rebuild use the runtime override above);
- a **rewrite** of every non-asset path to `/index.html` with status `200`. Without it any deep link (`/admin/...`, `/en/public/...`) 404s on refresh, since only `index.html` is emitted.

The Amplify domain must be in the Laravel API's CORS allowlist and in Reverb's allowed origins.

## Architecture map (`docs/` + the `/architecture` route)

`docs/` holds a **generated pair** describing this repo as a graph (79 nodes, 141 edges, plus named flows), produced by the `repo-architecture-map` skill:

- **`docs/architecture.json`** — the agent-readable version (`nodes`, `edges`, `flows`, `generated_from`). Read this first when orienting in an unfamiliar corner of the app; it is cheaper than grepping and encodes the relationships between composables, plugins, and pages.
- **`docs/architecture.html`** — the human-readable interactive diagram, rendered by `app/pages/architecture.vue`, which imports it with `?raw` and drops it into an `<iframe>` (isolating it from Tailwind and `@nuxt/ui`).

Both are **regenerable artifacts, not hand-maintained docs** — they go stale after structural changes; re-run the skill rather than patching the JSON by hand.

The `/architecture` route is **dev-only**. An inline module in `nuxt.config.ts` hooks `pages:extend` and, outside `nuxt dev`, splices out any page whose file ends in `pages/architecture.vue` — matching by _file_ rather than path, because i18n has already added the `/en/` variant by then. So neither the URL nor the diagram's contents reach the published bundle. If you add another dev-only page, follow that same by-file pattern.

`README.md` still links to `docs/en/00-index.md` and `docs/it/00-index.md`; **those directories do not exist** — the chapter docs were replaced by the architecture map above.

## End of session

After every code session run `make lint-fix` (or `pnpm eslint . --fix`) and report any remaining non-auto-fixable errors to the user.
