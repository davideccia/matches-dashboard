# 11 — Glossary

> See also: all chapters.

Terms specific to Vue, Nuxt, TypeScript, and the libraries used in this codebase, explained for a developer who has not worked with them before.

## Vue

| Term | Plain-language meaning |
|------|------------------------|
| **SFC** (Single-File Component) | A `.vue` file with three sections: `<template>` (markup), `<script setup>` (logic), `<style>` (CSS). One component per file. |
| **Composition API** | The modern Vue style where logic lives inside a `<script setup>` block using functions like `ref`, `computed`, `watch`. Replaces the older Options API. |
| **`ref<T>()`** | A one-cell reactive container. `count.value` reads/writes; the template auto-unwraps to `count`. ≈ a single-cell observable (BehaviorSubject). |
| **`computed()`** | A derived reactive value. Recalculates when its dependencies change. ≈ React's `useMemo` on autopilot. |
| **`watch()`** | Run a callback when one or more reactive values change. |
| **`onMounted` / `onBeforeUnmount`** | Lifecycle hooks. ≈ React's `useEffect(..., [])` and its cleanup function. |
| **Composable** | A function (named `use…`) that bundles reactive state and behavior for reuse. ≈ React hook. |
| **`defineProps` / `defineEmits` / `defineExpose`** | Compile-time macros inside `<script setup>` that declare a component's inputs, events, and externally accessible methods. |
| **Slot** | A named hole in a child component's template that the parent fills. `<template #header>` plugs into a `header` slot. ≈ React's `children` plus named children. |
| **`v-model`** | Two-way binding. `<UInput v-model="x" />` ↔ `<UInput :model-value="x" @update:model-value="x = $event" />`. |
| **Directive** | `v-if`, `v-for`, `v-on` (`@click`), `v-bind` (`:prop`). Compile-time template instructions. |

## Nuxt

| Term | Plain-language meaning |
|------|------------------------|
| **`pages/`** | Auto-routed. Every `.vue` file becomes a URL. `[id].vue` is a dynamic segment. |
| **`layouts/`** | Wrappers around pages. `default.vue` applies unless a page sets `definePageMeta({ layout: false })`. |
| **`middleware/`** | Functions run before navigation. The `.global.ts` suffix makes it run for every route. |
| **`plugins/`** | Run once on app boot. `.client.ts` suffix → browser only; `.server.ts` → server only. |
| **Auto-imports** | Files in `components/`, `composables/`, `utils/` are globally available — no `import` statement needed. |
| **`definePageMeta`** | Compile-time macro that attaches metadata (layout, middleware) to a route. Does not run at runtime. |
| **`useState<T>(key, factory)`** | SSR-safe shared ref keyed by string. In an SPA, effectively a singleton ref. |
| **`useAsyncData` / `useLazyAsyncData`** | Composables that wrap a fetcher and return `{ data, status, refresh, error }`. The `Lazy` variant does not block navigation. |
| **`$fetch`** | Nuxt's built-in HTTP client (powered by `ofetch`). Throws on non-2xx. |
| **`useRuntimeConfig()`** | Access values declared in `nuxt.config.ts` under `runtimeConfig`. `public.*` values are exposed to the browser bundle. |
| **`useAppConfig()`** | Access the reactive object exported by `app.config.ts`. Different from runtime config — meant for UI tokens. |
| **`navigateTo()`** | Programmatic navigation. Returns a redirect from middleware/pages. |
| **`ssr: false`** | Disable server-side rendering. Output is a static SPA. |
| **HMR** (Hot Module Replacement) | Vite swaps changed modules in a running app without a full reload. |

## TypeScript

| Term | Plain-language meaning |
|------|------------------------|
| **`as const`** | Narrows literal types and makes arrays/objects deeply readonly. `['A','B'] as const` has type `readonly ['A', 'B']`, not `string[]`. |
| **`typeof X[number]`** | Given a tuple `X`, this is the union of its element types. Combined with `as const`, gives a string-literal enum. |
| **`z.infer<typeof schema>`** | Pulls the TypeScript type out of a Zod schema so the form state and validator stay in sync. |
| **Generic component** | `<DataTable>` declares `generic="T extends Record<string, unknown>"` in `<script setup>`, so its `columns` and row type are linked. |

## i18n

| Term | Plain-language meaning |
|------|------------------------|
| **Locale** | A language tag (`it`, `en`). |
| **`useI18n()`** | Returns `{ t, locale, ... }` for the current component. `t('key')` looks up the translation. |
| **`useLocalePath()`** | Returns a function that turns a plain path (`/admin`) into the locale-aware path (`/admin` in Italian, `/en/admin` in English). |
| **`prefix_except_default`** | Routing strategy — default locale has clean URLs; other locales are prefixed (`/en/...`). |

## @nuxt/ui (component library)

| Term | Plain-language meaning |
|------|------------------------|
| **`UApp`** | Root provider. Hosts toasts, modals, tooltips. |
| **`UDashboardSidebar` / `UDashboardPanel` / `UDashboardGroup`** | Layout primitives for admin shells. |
| **`USlideover`** | A right-side drawer. Used here as the home of every form panel. |
| **`UForm` + `:schema`** | A form that runs a Zod schema on submit and surfaces field errors. |
| **`UTable`** | A headless-ish data table component. Wrapped by `DataTable` to add pagination and an empty state. |
| **Theme tokens** | `primary`, `secondary`, `neutral` etc. are configured in `app.config.ts` and applied as Tailwind utility classes like `bg-primary` and `text-muted`. |

## STOMP / WebSocket

| Term | Plain-language meaning |
|------|------------------------|
| **WebSocket** | A persistent, bidirectional TCP connection over HTTP upgrade. |
| **STOMP** | Simple Text-Oriented Messaging Protocol — a tiny pub/sub message framing layered on top of WebSocket. The backend exposes destinations like `/topic/...`; clients `subscribe`. |
| **`Client` (from `@stomp/stompjs`)** | The STOMP client object. `.activate()` connects, `.deactivate()` disconnects, `onConnect` is the place to subscribe. |
| **Topic** | A broadcast destination. Any subscriber to `/topic/tournaments/{id}/matches` receives every message published there. |
