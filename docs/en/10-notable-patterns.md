# 10 — Notable Patterns

> See also: [05 — Data Flow](05-data-flow.md), [06 — External Integrations](06-external-integrations.md).

Four recurring patterns shape most of this codebase. Once you internalize them, most files read as variations on these themes.

## 1. The DataTable + FormPanel recipe

Every admin list page is the same shape:

```vue
<template>
  <UDashboardPanel>
    <UPageHeader :title="t('users.title')">
      <template #right>
        <UButton :label="t('common.create')" @click="onCreate" />
      </template>
    </UPageHeader>

    <DataTable
      ref="dataTable"
      :url="'/api/desktop/users'"
      :columns="columns"
    >
      <!-- column slots for custom cells/actions -->
    </DataTable>

    <UserFormPanel
      :open="open"
      :item="editing"
      @saved="dataTable?.refresh()"
      @closed="open = false"
    />
  </UDashboardPanel>
</template>
```

The contract:

- `DataTable` owns pagination, page size, search, and the URL → server-page fetch. It exposes `refresh()` via `defineExpose`.
- The `*FormPanel` is a `USlideover` (right-drawer) with a Zod-validated form. It POSTs (create) or PUTs (edit) and emits `saved` and `closed`.
- The parent page wires them together: it has no fetch code, no validation code, no submit code — just column definitions and event handlers.

Adding a new admin resource means: write the columns, write the form panel, point the table at the URL. Three files, no plumbing.

### `DataTable` prop reference

| Prop / slot          | Type / default            | Purpose                                                                      |
|----------------------|---------------------------|------------------------------------------------------------------------------|
| `url` (required)     | `string`                  | Backend endpoint; query params `page`, `size`, `search` are appended automatically |
| `columns` (required) | `TableColumn<T>[]`        | Column definitions from `@nuxt/ui`                                           |
| `params`             | `QueryParams \| undefined` | Extra query params merged into every request (e.g. a filter value). Watched deeply — a change resets to page 1 |
| `pageSize`           | `number`, default `10`    | Initial page size; user can change it via the rows-per-page selector          |
| `searchable`         | `boolean`, default `true` | Show the search input. Disable for tables where server-side search is not supported |
| `showTotal`          | `boolean`, default `true` | Show the total-row-count badge                                                |
| `searchPlaceholder`  | `string \| undefined`     | Override the default placeholder in the search box                            |
| `emptyIcon`          | `string`, default `i-mdi-database` | Icon shown in the empty-state slot                                  |
| `emptyText`          | `string \| undefined`     | Override the default "no results" message                                     |
| `#filters` slot      | —                         | Rendered next to the search input — typically extra filter dropdowns          |
| `#empty` slot        | —                         | Full override of the empty-state content                                      |
| `defineExpose`       | `{ refresh, total, pending }` | Call `refresh()` from the parent after a mutation                         |

## 2. JWT in `localStorage`, hydrated on boot

Persistence: `localStorage`. Reactive state: `useState` cells keyed `'auth-token'` and `'auth-user'`. The `plugins/auth.client.ts` plugin runs on every page load:

```ts
// app/plugins/auth.client.ts
// 1. Hydrate state from localStorage.
// 2. Validate the token by calling GET /api/desktop/auth/user.
// 3. On 401, wipe both keys; the auth.global.ts middleware then redirects to /login.
```

Two consequences worth knowing:

- Every full reload makes one extra round-trip (the validation call). For an admin tool, that's acceptable.
- A stolen JWT is fully usable — `localStorage` is accessible to any script on the origin. Not unique to this app, but worth flagging.

## 3. `useState` as a shared singleton

There is no Pinia. Cross-component state uses Nuxt's `useState<T>(key, factory)` which returns the same `ref` for the same key. The factory is invoked once per app instance. Examples in this repo:

- `useState<string | null>('auth-token')` — current JWT
- `useState<AuthUser | null>('auth-user')` — current user

The pattern is enough because the app has very few shared pieces of state. If that ever changes, Pinia is the natural upgrade path.

## 4. Notify-then-refetch over WebSocket

The live scoreboard subscribes to `/topic/tournaments/{id}/matches`. The callback **ignores the message body** and re-issues the REST GET:

```ts
stompClient.subscribe(`/topic/tournaments/${id}/matches`, () => fetchMatches(id))
```

The pattern means the WebSocket is just an event signal; REST is still the only source of truth. The client never has to merge partial updates into reactive state, and reconnect-recovery is free — the next event will trigger a refresh that includes anything missed.

See [06](06-external-integrations.md) for the full setup, including the `http→ws` URL derivation and the explicit `activate`/`deactivate` lifecycle.

## 5. Auto-imports change how you read files

Nuxt auto-imports everything in `components/`, `composables/`, `utils/`, plus Vue and Nuxt APIs themselves. A file that uses `ref`, `computed`, `useState`, `useI18n`, `<DataTable>`, and `useApi` will have **zero** `import` lines for them. This is normal — when in doubt about where a symbol comes from, search the codebase or check the auto-generated `.nuxt/types/*.d.ts`.

## 6. i18n discipline: always add to both files

There are exactly two locale files: `i18n/locales/it.json` and `i18n/locales/en.json`. Every new key must land in both. The `@intlify/eslint-plugin-vue-i18n` ESLint plugin flags missing/unused keys — `pnpm eslint . --fix` will catch most slips.
