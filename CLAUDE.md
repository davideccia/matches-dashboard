# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Absolute priority: load skills before touching code

Before modifying or analyzing **any** piece of code in this repo, load these skills, in this order:

1. `/nuxt-ui` — this app is built on `@nuxt/ui`; component/API decisions must follow it.
2. `/nuxt4-patterns` — this app is Nuxt 4 (`ssr: false`, static SPA); data-fetching and hydration decisions must follow it.

This applies even to what looks like a trivial one-line change or a read-only analysis question. Do this first, before Read/Grep/Edit on app code.

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

`README.md` was resynced against the code on 2026-09-12 (commands, routes, config defaults, domain model, structure, CI). When you change a route, a `make` target, a `NUXT_PUBLIC_*` default, or the CI setup, update it there too — and keep the `Makefile` and `nuxt.config.ts` as the tiebreakers if they ever drift again. Note: README's own note on the `/architecture` route (in its Routes section) is itself stale as of this resync — see [Architecture map](#architecture-map-architecture-route--removed) below.

The build is static, so these values are baked into the bundle at **build time** — they end up in the `index.html` payload, not in the `_nuxt/` assets:

| Variable                            | Default                  | Purpose                                                                                                                                    |
| ----------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `NUXT_BASE_URL`                     | `https://api.matches.it` | Laravel API base URL. **Note the name**: it is not a `NUXT_PUBLIC_*` variable — `nuxt.config.ts` reads it directly into `sanctum.baseUrl`. |
| `NUXT_PUBLIC_REVERB_APP_KEY`        | —                        | Laravel Reverb app key                                                                                                                     |
| `NUXT_PUBLIC_REVERB_HOST`           | `localhost`              | Reverb WebSocket host                                                                                                                      |
| `NUXT_PUBLIC_REVERB_PORT`           | `8080`                   | Reverb WebSocket port                                                                                                                      |
| `NUXT_PUBLIC_REVERB_SCHEME`         | `http`                   | `http` or `https`                                                                                                                          |
| `NUXT_PUBLIC_ENV_SWITCHER_PASSWORD` | —                        | Plaintext password unlocking the API environment switcher from `/login`. **Empty ⇒ the gesture is disabled.**                              |

Those six are the **only** environment variables the code reads (`nuxt.config.ts:83-87,120`). `.env.example` is out of sync in two ways: it lists `PORT` (nothing in the app consumes it — it is only there for whatever serves the built files) and a comment mentioning `NUXT_PUBLIC_API_BASE`, which no longer exists. `nuxt.config.ts` is the tiebreaker.

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

For a whole deploy, set the values at build time — Amplify environment variables (needs a redeploy) or Docker `--build-arg` (needs a rebuild). The `localStorage` override is the escape hatch for repointing an already-built bundle.

## Architecture

**Static SPA client for a separate API.** `ssr: false` — `pnpm generate` emits static files in `.output/public/`, no Node server at runtime. All business logic, persistence, and auth live in a separate **Laravel API** ([repo](https://codeberg.org/davideccia/matches-api-laravel)). This frontend renders UI, validates input with Zod, and talks HTTP + WebSocket.

### Two audiences, one app

- **Admin** (`/admin/**`, `/login`) — authenticated via Sanctum token (stored in a cookie by `nuxt-auth-sanctum`). Protected by Sanctum's global middleware (`sanctum.globalMiddleware.enabled: true`), so **every route is protected by default**.
- **Public** (`/public/**`) — unauthenticated. Pages must opt out with `definePageMeta({ sanctum: { excluded: true } })`. `/login` uses `sanctum: { guestOnly: true }`.

The root `/` is **not a redirect** — `app/pages/index.vue` is a landing page with three entry buttons (`/login`, `/public/athletes/registration`, `/public/tournaments/match_records`), using `layout: false` and `sanctum: { guestOnly: true }`. Because `sanctum.redirect.onGuestOnly` is `/admin`, an already-authenticated admin hitting `/` lands on `/admin` instead. `/forgot-password` and `/reset-password` are `guestOnly` too.

### Key composables

- **`useApi()`** — wraps `useSanctumClient()` to add `Accept-Language`. Returns `get`, `post`, `put`, `del`, `upload`, `download`. All admin pages use this. Two things to know: `download()` **bypasses** the Sanctum client (uses `$fetch` with a blob response, reading the token manually via `useAuthTokenCookie()`); and the exported `getApiErrorMessage(e)` extracts the backend's error message and is used in every `catch` block to feed a toast.
- **`useAuth()`** — wraps `useSanctumAuth<{ data: User }>()`, unwrapping `{ data }` to expose `user`. Exposes `isAuthenticated`, `login`, `logout`, `fetchUser`. `plugins/auth.ts` hooks `sanctum:logout` → `useUser().clear()` (which calls `refreshNuxtData()`).
- **`app/utils/authToken.ts`** — replaces `nuxt-auth-sanctum`'s default token storage (wired in `app/app.config.ts` → `sanctum.tokenStorage`). Same cookie name (`sanctum.token.cookie`), but hardened: `sameSite: 'strict'`, explicit `path`, `secure` when the page is https, and `maxAge` pinned to the API's 1-week token TTL. The cookie **cannot** be `httpOnly` — JS has to read it to build the `Authorization` header. Change the cookie's options here, not at the call sites.

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

Backend enum values (`TOURNAMENT_STATUSES`, `MATCH_STATUSES`, `END_METHODS`, `GENDERS`, `CLIENT_TYPES`) are typed as `as const` arrays in `app/utils/constants.ts` — import from there instead of hardcoding strings. Domain interfaces are in `app/types/models.ts`; relations (e.g. `red_corner?`, `tournament?`) are optional and present only when the request includes `?with=...` (Laravel eager loading). There is **no `DB.md` in this repo** (an older note claimed one); the authoritative schema lives in the Laravel API repo.

### Security headers & CSP

Split across two places, and **both are Nitro-only** — they run on the Docker target and are absent from a `pnpm generate` build:

- **`nuxt.config.ts` → `routeRules['/**'].headers`** — the static ones: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS, `X-Robots-Tag`, and `Cache-Control: no-cache` on HTML (the HTML carries the `runtimeConfig` payload, so caching it means a stale SPA _and_ stale config; `/_nuxt/` keeps its own `immutable`).
- **`server/plugins/csp.ts`** — the CSP, and _only_ there. It hooks Nitro's `render:html`, sha256-hashes the three inline scripts Nuxt injects (importmap, color-mode snippet, `window.__NUXT__.config`) and emits `script-src 'self' <hashes>`. Fixed hashes in config would break on every build; `'unsafe-inline'` would void the point. Skipped in dev (Vite needs eval + HMR websocket).

Two consequences worth remembering: **Amplify ships no CSP or headers at all** unless they are replicated in the console; and `app/plugins/zod.ts` exists solely because of this CSP — it sets `z.config({ jitless: true })` so Zod skips its `Function('')` probe and stops logging an `unsafe-eval` violation on every load. `connect-src` is deliberately wide open (`https: wss: http: ws:`) because the runtime API override can repoint the app at any host.

### Shared utils

Before writing a formatting or derivation helper, look in `app/utils/`: `matchRecord.ts` (`cornerInfo()` and friends — corner/athlete/team display, `MISSING_VALUE`), `experienceTier.ts` (`formatTierRange()`), `date.ts`, `constants.ts` (enums + palettes), `authToken.ts`. Most of the "-"-when-missing and half-bout display logic already lives there.

### Theming

`app/app.config.ts` sets `@nuxt/ui` color tokens. The primary color is changeable at runtime from Settings; it persists to the `ui-primary-color` cookie and is reapplied on boot by `plugins/color-preference.client.ts`. `COLOR_PALETTE` and `COLOR_SECONDARY_MAP` in `constants.ts` define valid choices.

## Deployment

Two supported targets, and they no longer ship the same artifact:

- **Docker** builds with `pnpm build` (Nitro `node-server`) and runs a Node process under PM2.
- **Amplify** builds with `pnpm generate` and serves `.output/public` statically, so it still needs an **SPA rewrite of every non-asset path to `/index.html` with status `200`** — without it any deep link (`/admin/tournaments/42`, `/en/public/...`) 404s on refresh, because `nuxt generate` emits nothing for dynamic routes. Nitro does that fallback natively, so the Docker target does not need the rewrite.

Both need the build-time variables. Whatever host you use, its domain must be in the Laravel API's CORS allowlist and in Reverb's allowed origins.

### Docker (`docker/production/`)

Multi-stage build → `node:22-alpine` + PM2 (`pm2-runtime start ecosystem.config.cjs`), listening on port 3000 as user `node`. Meant to be driven from CI/CD — there is deliberately no compose file. The build context is the **repo root**, not the folder, and it needs BuildKit:

```bash
docker build -f docker/production/Dockerfile -t matches-dashboard:prod \
  --build-arg NUXT_BASE_URL=https://api.matches.it \
  --build-arg NUXT_PUBLIC_REVERB_HOST=reverb.matches.it \
  --build-arg NUXT_PUBLIC_REVERB_SCHEME=https --build-arg NUXT_PUBLIC_REVERB_PORT=443 .
```

**One image per environment**: the `NUXT_*` values are baked into the `index.html` payload, so the pipeline must pass them as `--build-arg` from its own secrets/variables and rebuild to change them. `docker/production/README.md` has the CI-ready invocation.

Four things to know:

- **The image serves only the app.** The nginx config that used to live here is gone. Only **TLS** and **compression** belong to the reverse proxy in front of the container; the security headers come from Nitro (see [Security headers & CSP](#security-headers--csp)). **Do not also set them on the proxy**: nginx `add_header` appends, and a browser given two CSPs applies the intersection, which breaks the app in hard-to-diagnose ways. `docker/production/README.md` has the table of what to switch off on an NPMplus-style panel.
- **`.output` is self-contained.** Nitro bundles the dependencies into it, so the runtime stage copies only `.output` and `ecosystem.config.cjs` — no `node_modules`, no pnpm.
- **`PM2_HOME=/tmp/.pm2`.** PM2 needs a writable dir for its daemon, pid and logs; keeping it under `/tmp` preserves the read-only rootfs (`--read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m`).
- **`pm2-runtime`, not `pm2 start`.** It stays in the foreground as PID 1 and forwards signals; `pm2 start` exits immediately and the container dies with it.

`pnpm install --frozen-lockfile` means **a `pnpm-lock.yaml` out of sync with `package.json` fails the build** — that is intentional, fix the lockfile rather than the flag.

### AWS Amplify Hosting

Static. **There is no `amplify.yml` in this repo** (it was removed) — the build spec lives in the Amplify console, along with:

- the build-time environment variables (a change needs a redeploy; for a one-off repoint without a rebuild use the runtime override above);
- the `/index.html` rewrite described above.

## Architecture map (`/architecture` route) — removed

There is no `/architecture` route anymore. `app/pages/architecture.vue` and the inline `pages:extend` module in `nuxt.config.ts` that used to splice it out of production builds were both deleted in commit `ba016b2` (2026-09-09, `chore(config): alias url`) — verified: neither `nuxt.config.ts` nor anything under `app/` references "architecture" today. Earlier revisions of this file described the page as merely broken (missing its `docs/architecture.html?raw` import); that's now moot, the page itself is gone. Don't resurrect that half-wired state — if a repo map is wanted again, it needs a fresh page plus a fresh dev-only guard.

**`docs/` is still an empty, untracked directory** (contents deleted in commit `1747ad5`, `chore(docs): removed`), and comments across several files (`nuxt.config.ts`, `server/plugins/csp.ts`, `app/utils/authToken.ts`, both CI workflows) still cite `docs/security-issues/README.md` for rationale that now only exists in those comments — see [Repo hygiene notes](#repo-hygiene-notes). `README.md` no longer links to `docs/en/00-index.md` / `docs/it/00-index.md` (that was cleaned up in the 2026-09-12 resync).

## End of session

After every code session run `make lint-fix` (or `pnpm eslint . --fix`) and report any remaining non-auto-fixable errors to the user.

## CI (`.github/workflows/`)

GitHub Actions, both jobs on the hosted `ubuntu-latest` runner (Docker and buildx are preinstalled there). This replaced Forgejo Actions (`.forgejo/workflows/`, removed in commit `8df4a60`, `chore(cicd): removed forgejo actions`) — the two workflow files below are direct translations of their Forgejo predecessors, so don't go looking for a `.forgejo/` directory, it's gone:

- **`ghcr-publish.yml`** — the live one. Triggers on **release published** (plus manual). Tags `latest` + the release title (fallback: release tag, normalised; short SHA on a manual run).
- **`docker-publish.yml`** — the Docker Hub twin, **disabled**: `workflow_dispatch` only, kept as a fallback. Tags `latest` + the version from `package.json` (not a short SHA, unlike its Forgejo predecessor).

Both pass the six build-time `NUXT_*` values as `--build-arg` from repository variables/secrets. `NUXT_PUBLIC_REVERB_APP_KEY` and `NUXT_PUBLIC_ENV_SWITCHER_PASSWORD` sit in _secrets_ for convenience only — being `NUXT_PUBLIC_*` they land in `index.html` in the clear. Don't build any confidentiality assumption on them.

## Repo hygiene notes

- **Code comments are in Italian** (see `server/plugins/csp.ts`, `app/utils/authToken.ts`, `nuxt.config.ts`). Match the surrounding language when editing a file; UI strings always go through i18n keys.
- **`yarn.lock` is tracked but stale** — pnpm is the package manager (`pnpm-lock.yaml`, `pnpm-workspace.yaml`, `--frozen-lockfile` in the Dockerfile). Never update `yarn.lock`.
- **`postman/`** holds a collection + environment for the Laravel API — the quickest way to check an endpoint's real shape.
- **Several files still point into the missing `docs/`**: comments in `nuxt.config.ts`, `server/plugins/csp.ts`, `app/utils/authToken.ts`, and both `.github/workflows/` CI files cite `docs/security-issues/README.md` for the rationale behind the CSP, the JS-readable token and the public-by-design env vars. That reasoning now exists only in those comments — read them before "fixing" any of it. See also [Architecture map](#architecture-map-architecture-route--removed).
