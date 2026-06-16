# 03 — Project Structure

This chapter is a guided tour of the repository so you know where to look for any given concern.

## Top-level layout

```
matches-dashboard-laravel/
├── app/                  # ALL application source lives here (Nuxt 4 convention)
├── i18n/locales/         # Translation files: it.json (default), en.json
├── public/               # Static files served as-is (favicons, manifest)
├── docs/                 # This documentation (en/ and it/)
├── postman/              # Postman API collections (manual API testing)
├── nuxt.config.ts        # Nuxt configuration — the project's control panel
├── app.config.ts         # (inside app/) runtime-changeable UI config
├── package.json          # Dependencies and scripts
├── Dockerfile            # Multi-stage build → nginx image
├── nginx.conf            # SPA routing for the container
├── Makefile              # Convenience targets (make dev, make setup…)
├── CLAUDE.md / README.md / DB.md   # Root documentation
```

> [!NOTE]
> In Nuxt 4, application code lives under `app/` (this is the "srcDir" convention). Configuration files like `nuxt.config.ts` stay at the repository root.

## Inside `app/`

```
app/
├── app.vue               # Root component — the outermost wrapper for every page
├── app.config.ts         # UI theme tokens (colours) + app version
├── assets/               # Bundled assets (logo.png, css/main.css)
├── components/           # Reusable components (auto-imported by filename)
├── composables/          # Reusable logic functions (useApi, useAuth, …)
├── layouts/              # Page shells (default.vue = the admin sidebar frame)
├── pages/                # Routes — file path becomes URL path
├── plugins/              # Code that runs once at app startup
├── types/                # TypeScript interfaces (models.ts)
└── utils/                # Plain helper functions (constants.ts, date.ts)
```

Each folder has a clear job:

### `pages/` — the routes (file-based routing)

The folder structure *is* the URL structure. A few examples from this repo:

| File | URL |
|------|-----|
| `app/pages/index.vue` | `/` (redirects to `/admin`) |
| `app/pages/login.vue` | `/login` |
| `app/pages/admin/index.vue` | `/admin` |
| `app/pages/admin/settings.vue` | `/admin/settings` |
| `app/pages/admin/configurations/athletes.vue` | `/admin/configurations/athletes` |
| `app/pages/admin/tournaments/index.vue` | `/admin/tournaments` |
| `app/pages/admin/tournaments/match_records/index.vue` | `/admin/tournaments/match_records` |
| `app/pages/admin/tournaments/match_records/board.vue` | `/admin/tournaments/match_records/board` |
| `app/pages/public/athletes/registration.vue` | `/public/athletes/registration` |
| `app/pages/public/tournaments/match_records.vue` | `/public/tournaments/match_records` |

With i18n, English versions get an `/en/` prefix automatically (e.g. `/en/admin/settings`). Italian, the default locale, has no prefix.

Each page can declare metadata via `definePageMeta({...})`. Two patterns matter here:

- Admin pages use `definePageMeta({ layout: 'default' })` to wrap themselves in the sidebar shell.
- Public pages use `definePageMeta({ layout: false, sanctum: { excluded: true } })` — no sidebar, and exempt from the login requirement (see [Chapter 05](05-authentication.md)).

### `components/` — the reusable UI pieces

Components are auto-imported by filename, so `<DataTable />` in any template refers to `app/components/DataTable.vue` with no import line. The notable ones:

| Component | Purpose |
|-----------|---------|
| `DataTable.vue` | Generic paginated, searchable table. The backbone of every admin list. See [Chapter 06](06-admin-crud-pattern.md). |
| `*FormPanel.vue` | One per resource (`AthleteFormPanel`, `TournamentFormPanel`, `MatchRecordFormPanel`, `UserFormPanel`, `DisciplineFormPanel`, `WeightCategoryFormPanel`, `RegistrationFormPanel`). A slide-over create/edit form. |
| `ApiSelectMenu.vue` | A searchable dropdown that loads its options from an API endpoint (with infinite scroll). |
| `MatchRecordCardReadOnly.vue` | A single match displayed as a card (used on the public scoreboard). |
| `MatchRecordJudgesPointsTable.vue` | Renders the per-round judges' scoring grid. |
| `LocaleSwitcher.vue`, `ColorModeSwitcher.vue` | Language and light/dark toggles. |

### `composables/` — reusable logic

These are the `useXxx()` functions (see [Chapter 02](02-tech-stack-concepts.md) for what a composable is):

| Composable | Purpose | Chapter |
|------------|---------|---------|
| `useApi.ts` | HTTP wrapper (`get/post/put/del/download`) with language headers | [07](07-data-flow-api.md) |
| `useAuth.ts` | Login/logout/current-user, wrapping Sanctum | [05](05-authentication.md) |
| `useUser.ts` | Tiny helper exposing `user` and a `clear()` | [05](05-authentication.md) |
| `useEcho.ts` | Returns the Laravel Echo realtime instance | [08](08-realtime-scoreboard.md) |
| `useTournamentMatchRecords.ts` | Subscribes to live match updates for a tournament | [08](08-realtime-scoreboard.md) |
| `useColorPreference.ts` | Reads/writes the user's theme colour | [10](10-i18n-theming.md) |

### `plugins/` — startup code

Plugins run once when the app boots. The `.client.ts` suffix means "browser only" (relevant because this is a SPA, but it documents intent).

| Plugin | What it does |
|--------|--------------|
| `echo.client.ts` | Creates the Laravel Echo / Reverb WebSocket connection and provides it as `$echo` |
| `color-preference.client.ts` | Applies the saved theme colour at startup |
| `auth.ts` | Hooks `sanctum:logout` to clear local user state |

### `layouts/` — page shells

`default.vue` is the admin frame: a collapsible sidebar (`UDashboardSidebar`) with the navigation menu, the app version badge, and a user dropdown with logout. Admin pages render *inside* its `<slot />`. Public pages opt out with `layout: false`.

### `utils/` — plain helpers

- `constants.ts` — all the domain enums as `as const` arrays (`GENDERS`, `TOURNAMENT_STATUSES`, `MATCH_STATUSES`, `END_METHODS`, `CLIENT_TYPES`), page-size options, and the theme colour palette. **Import enum values from here rather than hardcoding strings.** See [Chapter 09](09-domain-model.md).
- `date.ts` — `moment`-based date formatting helpers (server ↔ input conversion, localised display).

### `types/` — the data shapes

`models.ts` declares the TypeScript `interface`s for every backend entity (`Athlete`, `Tournament`, `Registration`, `MatchRecord`, `User`, `Discipline`, `WeightCategory`) and the `PaginatedResponse<T>` envelope Laravel returns. See [Chapter 09](09-domain-model.md).

Now that you know *where* things are, the next chapter covers how to actually build and run the app.
