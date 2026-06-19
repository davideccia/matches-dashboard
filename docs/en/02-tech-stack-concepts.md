# 02 — Tech stack & concepts

> See also: [03 — Project structure](03-project-structure.md), [06 — Data flow & the API layer](06-data-flow-api.md), [12 — Glossary](12-glossary.md)

This chapter introduces the project's technologies from scratch. If you already know Vue/Nuxt, skip to the final table; otherwise read through, because the concepts here recur throughout the documentation.

## The core concepts

### SPA (Single-Page Application)

An *SPA* (≈ an app that lives in a single HTML page) loads the browser once and then rewrites the page content with JavaScript as the user navigates, without reloading from scratch. Navigating between `/admin/tournaments` and `/admin/settings` needs no new round-trip to the server: only what JavaScript draws changes.

### Vue 3

*Vue* is a framework for building component-based interfaces. A **component** (≈ a reusable UI brick with its own HTML, logic, and style) is a `.vue` file split into three parts:

```vue
<template> <!-- the HTML --> </template>
<script setup lang="ts"> /* the logic, in TypeScript */ </script>
<style> /* optional style */ </style>
```

Vue concepts you'll meet constantly:

- `ref(x)` → a **reactive box** (≈ an observable variable): when its `.value` changes, the UI that uses it re-renders. In a `<template>` you write it without `.value`.
- `computed(() => …)` → a **derived** value that recomputes itself when its dependencies change.
- `watch(source, callback)` → runs a function **when** a reactive source changes. It's at the heart of many mechanisms here (debounced search, auto-scroll, WebSocket subscription).
- `v-model` → *two-way binding* (⇆): links a form input to a variable, in both directions.
- `defineProps` / `defineEmits` → how a component receives data from its parent (props) and reports events back (emit).

### Nuxt 4

*Nuxt* is a meta-framework built on top of Vue. Among other things, it adds:

- **File-based routing**: the folder structure under `app/pages/` automatically becomes the URL structure (see [Chapter 03](03-project-structure.md)).
- **Auto-imports**: components, `composables`, and helpers don't need manual imports — Nuxt makes them globally available. That's why the code uses `useApi()` or `<DataTable>` with no `import` at the top.
- **Composables**: `useXxx()` functions that encapsulate reusable logic with reactive state (≈ React hooks). Ours live in [`app/composables/`](../../app/composables/).
- **Plugins**: code that runs at app startup to configure something (here: Echo, auth, colour preference). They live in [`app/plugins/`](../../app/plugins/).

In this project Nuxt is configured with `ssr: false` ([`nuxt.config.ts`](../../nuxt.config.ts) line 5): no server-side rendering, static output. The consequences are in [Chapter 04](04-build-run-configure.md).

## The key libraries

| Library | What it does here | Explanation |
|---------|-------------------|-------------|
| **@nuxt/ui v4** | All the UI components (`UButton`, `UTable`, `USlideover`, `UForm`…) | A library of 125+ accessible Vue components built on *Tailwind CSS*. The project's components start with `U`. |
| **Tailwind CSS v4** | Styling | *Utility-first* CSS: styling is written with classes like `flex`, `gap-2`, `text-muted` directly in the HTML, instead of separate stylesheets. |
| **nuxt-auth-sanctum** | Login and route protection | Integrates *Laravel Sanctum* token auth. Provides `useSanctumClient()` and `useSanctumAuth()`. See [Chapter 05](05-authentication.md). |
| **Zod v4** | Form validation | You define a *schema* of the expected data and Zod validates input, returning per-field errors. See [Chapter 06](06-data-flow-api.md). |
| **Laravel Echo + pusher-js** | Realtime | A WebSocket client that subscribes to "channels" and listens for events. Here it talks to *Laravel Reverb*. See [Chapter 09](09-realtime-scoreboard.md). |
| **@nuxtjs/i18n** | Internationalisation | Manages the two languages (it/en) and the `/en/` prefix. See [Chapter 11](11-i18n-theming.md). |
| **moment** | Dates | Formats ISO dates for localised display. See [`app/utils/date.ts`](../../app/utils/date.ts). |
| **pnpm** | Package manager | A faster, disk-thrifty alternative to `npm`. |
| **TypeScript** | Language | JavaScript with types. Domain models are typed in [`app/types/models.ts`](../../app/types/models.ts). |

## An example that ties it together

This snippet (simplified from the real pattern) shows how the concepts collaborate:

```ts
// inside <script setup> of an admin page
const api = useApi()                       // auto-imported composable
const search = ref('')                     // reactive box
const { data } = useLazyAsyncData('x', () => // Nuxt's declarative fetch
  api.get('/api/admin/athletes', { search: search.value }),
  { watch: [search] },                     // re-reads when `search` changes
)
const items = computed(() => data.value?.data ?? []) // derived value
```

No `import`: `useApi`, `ref`, `computed`, and `useLazyAsyncData` are all auto-imported by Nuxt.
