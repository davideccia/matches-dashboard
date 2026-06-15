# 02 — Module Structure

> See also: [04 — UI & Navigation](04-ui-navigation.md), [10 — Notable Patterns](10-notable-patterns.md).

Nuxt has strong conventions: certain folders inside `app/` are *auto-discovered* — Nuxt scans them at build time and generates routing, imports, and types from the files it finds. You generally do not write `import` statements for things in `components/`, `composables/`, or `utils/`; Nuxt makes them globally available.

## Repository layout

```
matches-dashboard/
├── app/                  # all application source
├── i18n/locales/         # it.json, en.json — translation strings
├── public/               # static assets served as-is
├── postman/              # API exploration collections (not used at runtime)
├── docs/                 # this documentation
├── nuxt.config.ts        # framework configuration
├── package.json          # dependencies and scripts
├── Dockerfile            # multi-stage build → nginx:alpine
├── nginx.conf            # SPA routing (try_files … /index.html)
├── eslint.config.mjs     # flat-config ESLint (antfu preset)
└── tsconfig.json         # extends Nuxt's generated tsconfig
```

## Inside `app/`

| Path                       | Auto-discovered? | Role                                                                                                                                            |
|----------------------------|------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| `app.vue`                  | yes (entry)      | Root component. Mounts `<UApp>` (the `@nuxt/ui` provider, ≈ a top-level context provider) wrapping `<NuxtLayout>` and `<NuxtPage>`.            |
| `app.config.ts`            | yes              | Reactive runtime config (UI color tokens, version). Distinct from `nuxt.config.ts` — see [08](08-configuration-env.md).                         |
| `assets/css/main.css`      | no (imported)    | Tailwind v4 CSS-first config and global styles.                                                                                                 |
| `pages/`                   | yes              | File-based routing — every `.vue` file becomes a route. See [04](04-ui-navigation.md).                                                          |
| `layouts/`                 | yes              | `default.vue` is the admin sidebar shell. Pages opt out with `definePageMeta({ layout: false })`.                                               |
| `middleware/`              | yes              | Route guards. `auth.global.ts` runs before every navigation.                                                                                    |
| `components/`              | yes              | Reusable `.vue` components — auto-imported globally as `<DataTable>`, `<AthleteFormPanel>`, etc.                                                |
| `composables/`             | yes              | Functions starting with `use…` — `useApi`, `useAuth`, `useColorPreference`. Vue's *composables* (≈ React hooks).                                |
| `plugins/`                 | yes              | Runtime initializers. `auth.client.ts` runs on app boot to validate the stored JWT.                                                             |
| `utils/`                   | yes              | Plain functions and constants. `constants.ts` holds backend enum values as `as const` tuples.                                                   |

## Components: one file per concern

`app/components/` is flat (no subfolders). The naming makes the role obvious:

- `DataTable.vue` — generic paginated table; takes a `url` and `columns`. See [10](10-notable-patterns.md).
- `*FormPanel.vue` (e.g. `AthleteFormPanel`, `TournamentFormPanel`, `MatchFormPanel`) — Zod-validated forms inside a `USlideover` (right-side drawer). One per resource.
- `LocaleSwitcher.vue`, `ColorModeSwitcher.vue`, `ApiSelectMenu.vue` — small UI widgets.
- `MatchCardReadOnly.vue`, `MatchJudgesPointsTable.vue` — match-specific display components used by the live scoreboard and admin board.
- `AppFooter.vue` — footer shown in the sidebar.

## Pages: mirrored to URLs

```
app/pages/
├── index.vue                                # /        → redirects to /admin
├── login.vue                                # /login
├── admin/
│   ├── index.vue                            # /admin
│   ├── settings.vue                         # /admin/settings
│   ├── configurations/{users,athletes,disciplines,weight_categories}.vue
│   └── tournaments/{index,registrations}.vue
│       └── matches/{index,board}.vue        # /admin/tournaments/matches[/board]
└── public/
    ├── athletes/registration.vue            # /public/athletes/registration
    └── tournaments/matches.vue              # /public/tournaments/matches
```

With i18n in `prefix_except_default` mode, every page also responds at `/en/…` (Italian is the default and has no prefix). See [04](04-ui-navigation.md).
