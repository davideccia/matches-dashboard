# 04 — UI & Navigation

> See also: [02 — Module Structure](02-module-structure.md), [10 — Notable Patterns](10-notable-patterns.md).

Navigation in Nuxt is **file-based**: every `.vue` file under `app/pages/` becomes a URL. A *layout* wraps a group of pages with shared chrome (sidebar, header). A *route middleware* is a function Nuxt runs before each navigation, used here to gate the admin area.

## How routes are derived

| File                                                | URL (Italian, default)             | URL (English)                                |
|-----------------------------------------------------|------------------------------------|----------------------------------------------|
| `pages/index.vue`                                   | `/`                                | `/en/`                                       |
| `pages/login.vue`                                   | `/login`                           | `/en/login`                                  |
| `pages/admin/index.vue`                             | `/admin`                           | `/en/admin`                                  |
| `pages/admin/tournaments/index.vue`                 | `/admin/tournaments`               | `/en/admin/tournaments`                      |
| `pages/admin/tournaments/matches/board.vue`         | `/admin/tournaments/matches/board` | `/en/admin/tournaments/matches/board`        |
| `pages/public/tournaments/matches.vue`              | `/public/tournaments/matches`      | `/en/public/tournaments/matches`             |

The i18n module is in `prefix_except_default` mode (`nuxt.config.ts`), so Italian URLs have no prefix and English URLs are prefixed with `/en/`. To build a localized URL in code, use the `useLocalePath()` composable:

```ts
// app/layouts/default.vue, around line 50
const localePath = useLocalePath()
// localePath('/admin') → '/admin' in Italian, '/en/admin' in English
```

## Root redirect

`pages/index.vue` is a one-liner that redirects every visit to `/admin`. The `auth.global.ts` middleware then bounces unauthenticated users back to `/login`.

```vue
<!-- app/pages/index.vue -->
<script setup lang="ts">
const localePath = useLocalePath()
await navigateTo(localePath('/admin'), { replace: true })
</script>
```

## Layouts

There is one layout, `app/layouts/default.vue`. It renders the admin sidebar shell using `<UDashboardSidebar>` from `@nuxt/ui`. It builds the navigation menu from i18n strings and binds the user's email and `logout()` action.

Pages that should not be wrapped (login, the two public pages) opt out:

```vue
<script setup lang="ts">
definePageMeta({ layout: false })
</script>
```

`definePageMeta` is a Nuxt compile-time macro: the build extracts the call and attaches metadata to the route record, so it does not actually execute at runtime.

## Route middleware

`app/middleware/auth.global.ts` runs before every navigation. The `.global.ts` suffix makes it apply everywhere — non-global middleware is referenced explicitly with `definePageMeta({ middleware: [...] })`.

```ts
// app/middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) { return }      // SPA only, but guard for safety
  const { isAuthenticated } = useAuth()
  const publicPaths = ['/login', '/public/athletes/registration', '/public/tournaments/matches']
  const isPublicPath = publicPaths.some(p => to.path === p || to.path.endsWith(p))

  if (!isAuthenticated.value && !isPublicPath) { return navigateTo('/login') }
  if (isAuthenticated.value && to.path === '/login') { return navigateTo('/admin') }
})
```

Note the use of `to.path.endsWith(p)` — this is how the middleware allows the locale-prefixed variants (`/en/public/...`) without listing them explicitly.

## i18n strings

Every user-facing string lives in `i18n/locales/it.json` and `i18n/locales/en.json`. In a component:

```vue
<script setup lang="ts">
const { t } = useI18n()
</script>
<template>
  <h1>{{ t('publicMatches.title') }}</h1>
</template>
```

**Rule:** never hardcode user-facing text. When you add a key, add it to both locale files in the same commit.
