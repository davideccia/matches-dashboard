# 11 — Glossary

Every language- and framework-specific term glossed in this documentation, alphabetised. Domain terms (tournament, bout, etc.) are defined in [Chapter 09](09-domain-model.md).

- **Auto-import (Nuxt)** — Nuxt automatically makes Vue functions, your composables, and your components available without writing `import` statements. Explains why `useApi()` or `<DataTable />` appear with no import line.

- **Bearer token** — an auth credential sent in the HTTP header `Authorization: Bearer <token>`. The Sanctum client attaches it automatically; the `download` helper does so manually.

- **Build-time vs runtime** — *build-time* config is fixed when you compile the app (`nuxt.config.ts`, env vars baked into the bundle). *Runtime* config can change while the app runs (`app.config.ts`, the theme colour).

- **Component (Vue)** — a reusable, self-contained piece of UI defined in a `.vue` file (template + script + optional style). The building block of the interface.

- **Composable** — a Vue/Nuxt convention: a reusable function named `useSomething()` that packages stateful logic so multiple components can share it (≈ a mini-service). Example: `useApi`, `useAuth`.

- **`computed`** — a reactive value derived from other reactive values; recalculates automatically when its inputs change.

- **CRUD** — Create, Read, Update, Delete: the four basic operations on a record. The admin pages are CRUD screens. See [Chapter 06](06-admin-crud-pattern.md).

- **Debounce** — waiting until activity stops before acting (e.g. waiting 300 ms after the user stops typing before firing a search request), to avoid a flood of calls.

- **`defineExpose`** — a Vue API letting a component publish methods/values to its parent via a template `ref`. `DataTable` exposes `refresh()` this way.

- **`definePageMeta`** — Nuxt API to attach metadata to a page (its layout, auth rules). E.g. `{ layout: false, sanctum: { excluded: true } }`.

- **Eager-load (`with=`)** — asking the backend to include related records in a response (e.g. a match with its red/blue corner athletes), via a `with=relation1,relation2` query parameter. Otherwise those relation fields are absent.

- **Echo (Laravel Echo)** — the browser-side client library for subscribing to server-pushed realtime events over WebSocket. See [Chapter 08](08-realtime-scoreboard.md).

- **Enum** — a fixed set of allowed string values (e.g. match statuses). Declared as `as const` arrays in `constants.ts` so TypeScript derives a union type.

- **File-based routing** — Nuxt turns the `app/pages/` file tree directly into URLs; `pages/admin/settings.vue` becomes `/admin/settings`. No manual route table.

- **i18n** — *internationalisation*: supporting multiple languages. Handled by `@nuxtjs/i18n`. See [Chapter 10](10-i18n-theming.md).

- **IntersectionObserver** — a browser API that fires a callback when an element scrolls into view. `ApiSelectMenu` uses it to implement infinite scroll.

- **Locale** — a language/region setting (`it`, `en`). Determines translations and URL prefix.

- **Middleware (route)** — code that runs before a route loads, to allow/redirect it. Sanctum's *global middleware* protects every route unless a page opts out.

- **Module (Nuxt)** — a package that extends Nuxt's capabilities, registered in `nuxt.config.ts` (`@nuxt/ui`, `@nuxtjs/i18n`, `nuxt-auth-sanctum`, `@nuxt/eslint`).

- **Notify-then-refetch** — the realtime pattern here: the WebSocket message is a minimal "something changed" signal; the client then re-fetches the authoritative data over HTTP. See [Chapter 08](08-realtime-scoreboard.md).

- **Pinia / store** — *not used here*; state is held in composables and Nuxt's data cache instead. Listed only to note its absence.

- **Plugin (Nuxt)** — code that runs once at app startup to set things up (e.g. create the Echo connection). Files in `app/plugins/`; `.client.ts` = browser-only.

- **pnpm** — the package manager used (a faster, disk-efficient alternative to npm). Commands: `pnpm <script>`.

- **`provide` / `$echo`** — a plugin can `provide` a value that becomes available app-wide on the Nuxt app instance (here `$echo`, the Echo client).

- **Pusher protocol / pusher-js** — the WebSocket messaging protocol that Laravel Reverb speaks and that Echo uses under the hood via the `pusher-js` library.

- **`reactive` / `ref`** — Vue's reactivity primitives. `ref(x)` wraps a single value (accessed via `.value` in script); `reactive({...})` wraps an object. Changing them re-renders the UI.

- **Reverb (Laravel Reverb)** — the Laravel server-side WebSocket server that pushes realtime events to the browser. See [Chapter 08](08-realtime-scoreboard.md).

- **Sanctum (Laravel Sanctum)** — Laravel's token-based authentication system. The `nuxt-auth-sanctum` module integrates it. See [Chapter 05](05-authentication.md).

- **Schema (Zod)** — a declared description of a data shape and its rules. Zod validates form data against it before submission.

- **`<script setup>`** — Vue's concise single-file-component syntax where top-level declarations are auto-exposed to the template.

- **Slide-over (`USlideover`)** — a `@nuxt/ui` panel that slides in from the screen edge; used for create/edit forms.

- **Slot** — a placeholder in a component's template that the parent fills with custom markup. `DataTable` uses named slots like `#actions-cell` for custom column rendering.

- **SPA (Single-Page Application)** — a web app that loads one HTML shell and renders/navigates everything client-side with JavaScript. This project is a SPA (`ssr: false`).

- **SSR (Server-Side Rendering)** — rendering pages on a server before sending HTML. Explicitly *disabled* here (`ssr: false`), making the app a static SPA.

- **Tailwind CSS** — a utility-first CSS framework: you style elements with many small class names (`flex gap-4 rounded-xl`) directly in markup.

- **Toast** — a small, transient notification popup. Used for success/error feedback after API calls (`useToast()`).

- **`useAsyncData` / `useLazyAsyncData`** — Nuxt helpers that run an async fetcher and return reactive `data` / `status` / `refresh`. The "lazy" variant doesn't block navigation while loading.

- **`useCookie`** — a Nuxt composable for reading/writing a cookie reactively. Used for the theme colour and the Sanctum token.

- **`v-model`** — Vue two-way binding between an input (or child component) and a variable.

- **WebSocket** — a persistent two-way connection between browser and server that lets the server push messages without being polled. The basis of the live scoreboard.

- **Zod** — a TypeScript schema-validation library used to validate every form's data. See [Chapter 07](07-data-flow-api.md).
