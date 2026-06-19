# 03 — Project structure

> See also: [02 — Tech stack & concepts](02-tech-stack-concepts.md), [05 — Authentication](05-authentication.md), [07 — The admin CRUD pattern](07-admin-crud-pattern.md)

This chapter is a map of the repository: where things live, and how the folder structure translates into URLs.

## The big picture

```
app/
├── app.config.ts        # theme tokens (@nuxt/ui): primary/secondary/neutral colours
├── app.vue              # root component (mounts layout + page)
├── assets/              # logo, global CSS
├── components/          # reusable components
│   ├── DataTable.vue          # generic paginated table
│   ├── ApiSelectMenu.vue      # select that loads options from an endpoint
│   ├── MatchRecordCardReadOnly.vue
│   └── panels/                # form panels (slideovers) for CRUD
│       ├── AthleteFormPanel.vue
│       ├── TournamentFormPanel.vue
│       └── …
├── composables/         # reusable stateful logic (useXxx)
│   ├── useApi.ts              # HTTP client to the Laravel API
│   ├── useAuth.ts             # authentication state
│   ├── useEcho.ts             # access to the Echo instance
│   ├── useTournamentMatchRecords.ts  # WebSocket subscription
│   └── useColorPreference.ts  # runtime theme colour
├── layouts/
│   └── default.vue            # admin shell: collapsible sidebar + page slot
├── pages/               # file-based routing (see below)
│   ├── index.vue              # `/` → redirect to /admin
│   ├── login.vue              # `/login`
│   ├── admin/                 # authenticated pages
│   └── public/                # unauthenticated pages
├── plugins/             # startup code
│   ├── echo.client.ts         # initialises Laravel Echo (client only)
│   ├── auth.ts                # hooks into Sanctum logout
│   └── color-preference.client.ts  # applies the saved colour at startup
├── types/
│   └── models.ts              # domain TypeScript interfaces
└── utils/
    ├── constants.ts           # domain enums + colour palette
    └── date.ts                # date formatting helpers

i18n/locales/            # it.json (default) + en.json — keep in sync
docs/                    # this documentation (it + en)
```

## File-based routing

In Nuxt, every `.vue` file under [`app/pages/`](../../app/pages/) becomes a route. The file path *is* the URL:

| File | URL |
|------|-----|
| `pages/index.vue` | `/` |
| `pages/login.vue` | `/login` |
| `pages/admin/index.vue` | `/admin` |
| `pages/admin/tournaments/index.vue` | `/admin/tournaments` |
| `pages/admin/tournaments/registrations.vue` | `/admin/tournaments/registrations` |
| `pages/admin/tournaments/match_records/index.vue` | `/admin/tournaments/match_records` |
| `pages/admin/tournaments/match_records/board.vue` | `/admin/tournaments/match_records/board` |
| `pages/admin/configurations/athletes.vue` | `/admin/configurations/athletes` |
| `pages/public/athletes/registration.vue` | `/public/athletes/registration` |
| `pages/public/tournaments/match_records.vue` | `/public/tournaments/match_records` |

(The full route list is also in [`README.md`](../../README.md).)

With i18n enabled, the same pages are also reachable with an `/en/` prefix for English (e.g. `/en/admin/tournaments`); Italian, being the default, has no prefix. See [Chapter 11](11-i18n-theming.md).

### admin vs public: two worlds

The split between `pages/admin/` and `pages/public/` is not just organisational: it drives **authentication**. All routes are protected by default by Sanctum's global middleware; public pages opt out with `definePageMeta({ sanctum: { excluded: true } })`. Details in [Chapter 05](05-authentication.md).

## How the pieces compose

A typical admin page contains **little** logic: it orchestrates reusable components.

```
layouts/default.vue          ← sidebar + shell (applies to every admin page)
   └── pages/admin/…/foo.vue ← the page: defines columns and manages state
         ├── <DataTable>      ← generic paginated table
         ├── <FooFormPanel>   ← slideover to create/edit
         └── <ApiSelectMenu>  ← (inside the form) select from an endpoint
```

This recipe — table + form panel + select — is detailed in [Chapter 07](07-admin-crud-pattern.md). The rule in [`nuxt.config.ts`](../../nuxt.config.ts) (lines 9-12)

```ts
components: [
  { path: '~/components/panels', pathPrefix: false },
  '~/components',
],
```

tells Nuxt to auto-register the panels **without** a path prefix — that's why you write `<AthleteFormPanel>` and not `<PanelsAthleteFormPanel>`.

## The `.client.ts` plugin convention

Plugins suffixed `.client.ts` (e.g. [`echo.client.ts`](../../app/plugins/echo.client.ts), [`color-preference.client.ts`](../../app/plugins/color-preference.client.ts)) run **only in the browser**, never at build time. That makes sense for the WebSocket and for cookies, which only exist on the client.
