# 02 — Tech Stack & Concepts

This chapter explains the technologies the project is built on, aimed at a developer who has not used them before. Versions are read from [`package.json`](../../package.json).

## The foundational concepts

### Vue 3 — the component framework

**Vue** (`vue@^3.5`) is a JavaScript framework for building user interfaces out of **components** (≈ reusable custom HTML elements that bundle markup, styling and behaviour together). A Vue component lives in a `.vue` file with three sections:

```vue
<template> <!-- the HTML-like markup --> </template>
<script setup lang="ts"> /* the TypeScript logic */ </script>
<style> /* optional, scoped CSS */ </style>
```

Two Vue ideas you will see constantly:

- **Reactivity** — `ref(0)` and `reactive({...})` create values that, when changed, automatically re-render any part of the UI that uses them. `ref` wraps a single value (read/write it via `.value` in script); `reactive` wraps an object. A `computed(() => …)` is a value derived from others that recalculates on demand.
- **`<script setup>`** — a compile-time shorthand where everything you declare in the script block is automatically available in the template. No explicit "export" wiring needed.

`v-model` is **two-way binding** (≈ keep this input box and this variable in sync, both directions). `v-for`, `v-if` are loop and conditional directives in the template.

### Nuxt 4 — the application framework on top of Vue

**Nuxt** (`nuxt@^4.4`) is a framework built on Vue that adds project structure and conventions so you write less wiring. Its superpowers here:

- **File-based routing** — a file at `app/pages/admin/settings.vue` automatically becomes the URL `/admin/settings`. No router config to maintain. (Detail in [Chapter 03](03-project-structure.md).)
- **Auto-imports** — Vue functions (`ref`, `computed`, `watch`), your own composables (`useApi`, `useAuth`), and components are available *without* `import` statements. If you see `useApi()` used with no import at the top of a file, this is why.
- **Composables** — a Nuxt/Vue convention: a function named `useSomething()` that packages reusable stateful logic (≈ a mini-service you call from a component). This codebase has several; see [Chapter 07](07-data-flow-api.md).
- **Modules** — plugins that extend Nuxt. Configured in [`nuxt.config.ts`](../../nuxt.config.ts): `@nuxt/ui`, `@nuxtjs/i18n`, `@nuxt/eslint`, `nuxt-auth-sanctum`.

### SPA mode (`ssr: false`) — what kind of Nuxt app this is

Nuxt can render pages on a server (SSR) or build a pure browser app. This project sets `ssr: false` in [`nuxt.config.ts`](../../nuxt.config.ts), making it a **SPA** — a *Single-Page Application* (≈ one HTML shell that the browser fills in with JavaScript; navigation happens client-side without full page reloads).

Two important consequences flow directly from `ssr: false`:

1. **No Node.js server at runtime.** `pnpm build` produces *static files* (HTML/JS/CSS) that any plain web server (here, nginx) can serve. There is no server-side code from this repo running in production.
2. **Environment variables are baked in at build time.** Because nothing from this repo runs on a server to read env vars at request time, values like the API URL are *compiled into the JavaScript bundle* when you build. Changing the backend URL means rebuilding. This is covered in [Chapter 04](04-build-run-configure.md) and is a common source of confusion.

## The key libraries

| Library | Version | Role | Glossed |
|---------|---------|------|---------|
| `@nuxt/ui` | `^4.8` | The component library | A ready-made set of 125+ styled, accessible UI components (`UButton`, `UTable`, `UForm`, `USlideover`…). Anything starting with `U` in a template comes from here. |
| `tailwindcss` | `^4.3` | Styling | **Utility-first CSS** (≈ tiny single-purpose class names like `flex gap-4 rounded-xl` composed directly in markup, instead of writing separate stylesheets). |
| `nuxt-auth-sanctum` | `^3.1` | Authentication | Wires the app to **Laravel Sanctum** (≈ Laravel's token-based login system). Provides `useSanctumClient()` and `useSanctumAuth()`. See [Chapter 05](05-authentication.md). |
| `laravel-echo` + `pusher-js` | `^2.3` / `^8.5` | Realtime | **Echo** is a client for subscribing to server-pushed events; **pusher-js** is the underlying WebSocket protocol it speaks. Connects to **Laravel Reverb**. See [Chapter 08](08-realtime-scoreboard.md). |
| `@nuxtjs/i18n` | `^10.4` | Internationalisation | Translations and locale-prefixed URLs (Italian default, `/en/` for English). See [Chapter 10](10-i18n-theming.md). |
| `zod` | `^4.4` | Validation | **Schema validation** (≈ declare the shape and rules a piece of data must satisfy; reject it if it doesn't). Used for every form. See [Chapter 07](07-data-flow-api.md). |
| `moment` | `^2.30` | Dates | Date formatting/parsing, wrapped in [`app/utils/date.ts`](../../app/utils/date.ts). |
| `vue-router` | `^5.0` | Routing | The underlying router Nuxt drives via file-based routing. You rarely touch it directly. |
| `@internationalized/date`, `reka-ui` | — | Transitive | Pulled in by `@nuxt/ui` for date handling and headless component primitives. |

## Tooling

- **pnpm** — the package manager (≈ npm, but faster and disk-efficient via a shared store). Commands are `pnpm <script>`.
- **TypeScript** (`typescript@^6`) — JavaScript with static types. The whole app is typed; domain types live in [`app/types/models.ts`](../../app/types/models.ts).
- **ESLint** with `@antfu/eslint-config` — the linter and code-style enforcer. House style: **single quotes, no semicolons, sorted imports**. Run `pnpm eslint . --fix` after editing (see [`CLAUDE.md`](../../CLAUDE.md)).
- **Vite** — the build tool and dev server bundler that Nuxt uses under the hood.

With the vocabulary in place, the next chapter walks the actual directory layout.
