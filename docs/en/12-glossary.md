# 12 — Glossary

> See also: all chapters.

Language-, framework-, or domain-specific terms used in this documentation, explained for someone who has never met them. In alphabetical order.

| Term | Plain-language meaning |
|------|------------------------|
| **`as const`** | In TypeScript, marks an array/object as immutable and narrows its type to the exact literal values. Used for the domain enums in `constants.ts`. |
| **Auto-import** | A Nuxt feature that makes components, composables, and helpers available without writing their `import`. That's why `useApi()` or `<DataTable>` appear "out of nowhere". |
| **Build-time vs runtime** | *Build-time* = when the app is compiled; *runtime* = when it runs in the browser. With `ssr: false`, the `NUXT_PUBLIC_*` variables are fixed at build time. |
| **Channel** | A WebSocket "topic" you subscribe to in order to receive events. Here: `tournaments.{id}.match_records`. |
| **Composable** | A `useXxx()` function that encapsulates reusable logic with reactive state. Analogous to a React hook. |
| **`computed`** | A derived value in Vue that recomputes automatically when its dependencies change. |
| **CRUD** | Create, Read, Update, Delete: the four basic operations on a resource. The pattern of Chapter 07. |
| **Debounce** | A technique that delays an action until there's a pause (here 300 ms): avoids querying the API on every keystroke during search. |
| **`defineModel` / `defineProps` / `defineEmits`** | Vue macros to declare, respectively, a `v-model`, a component's incoming props, and its outgoing events. |
| **Eager loading** (`with=`) | Asking the backend to include a record's relations in the same response, avoiding follow-up requests. |
| **Echo** (Laravel Echo) | A client library for subscribing to channels and listening for WebSocket events. |
| **Enum** | A closed set of allowed values (e.g. a match's statuses). Here realised with `as const` arrays. |
| **Event** (broadcast) | A message published on a WebSocket channel. Here: `.MatchRecordChanged`. |
| **`findIndex`** | A JS array method: returns the index of the first element matching a condition, or `-1` if none. Used to find the in-progress match. |
| **Function ref** (`:ref="(el) => …"`) | Vue's way to obtain an element's real DOM node, even inside a `v-for`. Used by the auto-scroll to map index → element. |
| **Hydration** | The process by which JS "brings the HTML to life", making it interactive. `<ClientOnly>` avoids hydration issues for components that exist only in the browser. |
| **i18n** | Internationalisation: handling multiple languages. |
| **IntersectionObserver** | A browser API that notifies when an element enters/leaves the viewport. Used for `ApiSelectMenu`'s infinite scroll. |
| **Middleware** | A layer that intercepts requests/navigations. Sanctum's global middleware protects all routes by default. |
| **`nextTick`** | In Vue, waits until the DOM has updated after a state change. Crucial for the auto-scroll: without it, the card elements wouldn't exist yet. |
| **Notify-then-refetch** | The live scoreboard pattern: the WebSocket sends only "re-read", then the client re-reads via REST. Keeps REST the single source of truth. |
| **Nuxt** | A meta-framework on top of Vue: file-based routing, auto-imports, composables, plugins. |
| **Laravel pagination** | The standard list shape from the API: `{ data: T[], meta: { total, current_page, last_page, per_page } }`. |
| **Plugin** | Code executed at app startup to configure something (Echo, auth, theme colour). |
| **Popover** | A floating panel anchored to an element (here: the `ApiSelectMenu` menu). |
| **`ref`** | Vue's reactive box: changing its `.value` re-renders the UI that uses it. |
| **Reverb** | Laravel's WebSocket server, compatible with the Pusher protocol. |
| **File-based routing** | A Nuxt convention: the `app/pages/` structure defines the URLs. |
| **Sanctum** | Laravel's authentication system. Here in *token mode*: the client receives a token and attaches it to requests. |
| **`scrollIntoView`** | A DOM method that scrolls the page to bring an element into view. With `block: 'center'` it centres it vertically. |
| **Seek (auto-scroll)** | The board's automatic scroll to the in-progress match (or, failing that, the next scheduled one). See Chapter 08. |
| **Slideover** | A panel that slides in from one side of the screen (the `USlideover` component). Used by the `*FormPanel`s. |
| **SPA** | Single-Page Application: a single HTML page, content rewritten via JS during navigation. |
| **`ssr: false`** | Disables server-side rendering: Nuxt produces a static site, with no Node server at runtime. |
| **Red corner / blue corner** (`red_corner` / `blue_corner`) | The two contenders in a bout. The universal ring-sport convention for distinguishing the two athletes. |
| **Thin client** | A "lean" client: it draws the interface but keeps no data or rules, which live in the backend. |
| **Token** | A credential issued at login and attached to requests as `Authorization: Bearer …`. |
| **Tailwind CSS** | A utility-first CSS framework: styling is written with classes (`flex`, `gap-2`) directly in the HTML. |
| **`v-model`** | Vue's two-way binding: links an input to a variable in both directions. |
| **`watch`** | Runs a function when a reactive source changes. The engine behind debounced search, auto-scroll, and WebSocket subscriptions. |
| **WebSocket** | A persistent two-way browser↔server channel that lets the server "push" messages to the client. |
| **Zod** | A schema-validation library: you define the expected shape of the data and Zod validates the input. |
