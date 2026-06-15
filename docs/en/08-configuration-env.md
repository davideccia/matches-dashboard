# 08 — Configuration & Env

> See also: [01 — Overview](01-overview.md), [03 — Build, Run, Test](03-build-run-test.md).

There are three places configuration lives: build-time (`nuxt.config.ts`), runtime UI state (`app.config.ts`), and per-user preferences (`localStorage`). Knowing which is which prevents two common surprises: env vars not updating in production, and theme changes not persisting.

## `nuxt.config.ts` — build-time framework config

This file is read once, at build time. Changing it requires a rebuild.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,                      // static SPA — no Node server in prod
  modules: ['@nuxt/ui', '@nuxtjs/i18n', '@nuxt/eslint'],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:8081',
    },
  },
  css: ['~/assets/css/main.css'],
  vite: { optimizeDeps: { include: ['@vue/devtools-core', '@vue/devtools-kit', '@stomp/stompjs', 'zod'] } },
  colorMode: { preference: 'system' },
  i18n: {
    defaultLocale: 'it',
    langDir: 'locales',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'it', name: 'Italiano', file: 'it.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
  },
})
```

### `runtimeConfig.public.apiBase`

With `ssr: false`, **`process.env` is read only at build time**. The value of `NUXT_PUBLIC_API_BASE` at the moment of `pnpm build` (or `docker build --build-arg`) is hard-coded into the bundle. There is no `.env` file consulted at runtime.

This is intentional — there is no Node process in production to read env vars. To target a different backend, rebuild with a different `NUXT_PUBLIC_API_BASE`.

In code, read it with `useRuntimeConfig()`:

```ts
const { public: { apiBase } } = useRuntimeConfig()
```

### i18n strategy

`prefix_except_default` means Italian (the default) has clean URLs and English is prefixed with `/en/`. See [04](04-ui-navigation.md).

### Color mode

`colorMode: { preference: 'system' }` makes light/dark follow the OS. The user can override via `ColorModeSwitcher.vue`; the choice is stored by `@nuxtjs/color-mode` in a cookie/localStorage.

## `app.config.ts` — reactive UI config

This is *different* from `nuxt.config.ts`. It is a small reactive object available app-wide via `useAppConfig()`. The `@nuxt/ui` library reads its color tokens from here.

```ts
// app/app.config.ts
import pkg from '../package.json'

export default defineAppConfig({
  ui: {
    colors: {
      primary: 'sky',
      secondary: 'blue',
      neutral: 'mist',
    },
  },
  version: pkg.version,
})
```

Mutating `appConfig.ui.colors.primary` at runtime triggers a re-render with the new theme. That is what the Settings page does.

## Per-user preferences in `localStorage`

The browser holds three keys:

| Key                  | Set by                              | Purpose                                        |
|----------------------|-------------------------------------|------------------------------------------------|
| `auth-token`         | `useAuth().login()` / plugin        | JWT bearer token                               |
| `auth-user`          | `useAuth().login()` / plugin        | Serialized current user                        |
| `ui-primary-color`   | `useColorPreference().setColor()`   | Primary color override (e.g. `'emerald'`)      |

`useColorPreference()` reads the saved color on mount and applies it to `appConfig`:

```ts
// app/composables/useColorPreference.ts
onMounted(() => {
  const saved = localStorage.getItem('ui-primary-color')
  if (saved && COLOR_PALETTE.some(c => c.name === saved)) {
    setColor(saved)
  }
})
```

There is no client database, no IndexedDB, no service worker — `localStorage` is the entire persistence story on the client. The auth and color preferences are the only things that survive a reload.

## What is *not* configurable

- The Spring Boot endpoint paths (`/api/desktop/...`, `/ws`) are hard-coded in calls and the STOMP setup.
- The set of locales (`it`, `en`) is fixed in `nuxt.config.ts`.
- The color palette (`COLOR_PALETTE` in `constants.ts`) and the matching `COLOR_SECONDARY_MAP` are the only valid primary colors.
