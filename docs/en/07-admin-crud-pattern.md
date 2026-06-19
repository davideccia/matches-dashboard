# 07 — The admin CRUD pattern

> See also: [06 — Data flow & the API layer](06-data-flow-api.md), [08 — Match board & auto-scroll](08-match-board-and-scroll.md)

Almost every admin page (athletes, disciplines, weight categories, users, tournaments) is the same recipe repeated. Learn it once and you know them all. The recipe combines three reusable components: **`DataTable`**, a **`*FormPanel`**, and **`ApiSelectMenu`**.

## The recipe in three steps

1. **`DataTable`** — a generic paginated table. It takes a `url` and `columns`, fetches by itself, handles search/pagination/refresh, and exposes `refresh()`.
2. **`*FormPanel`** — a *slideover* (≈ a panel that slides in from the side) with a Zod-validated form for create/edit. It emits `saved` when a save succeeds.
3. **`ApiSelectMenu`** — inside the form, a select that loads its options from an endpoint (to pick related resources: a category, a discipline…).

The page just defines the columns, manages state (`panelOpen`, `editingItem`), and wires up the events.

## Full example: the athletes page

From [`app/pages/admin/configurations/athletes.vue`](../../app/pages/admin/configurations/athletes.vue) (simplified):

```vue
<template>
  <DataTable ref="tableRef" url="/api/admin/athletes" :columns="columns" empty-icon="i-mdi-account">
    <!-- custom cells via slots named `<column>-cell` -->
    <template #birth_date-cell="{ row }">
      {{ formatServerDateOnly((row.original as Athlete).birth_date, locale) }}
    </template>
    <template #actions-cell="{ row }">
      <UButton icon="i-mdi-pencil" @click="openEdit(row.original as Athlete)" />
      <UButton icon="i-mdi-delete" color="error" @click="confirmDelete(row.original as Athlete)" />
    </template>
  </DataTable>

  <ClientOnly>
    <AthleteFormPanel v-model="panelOpen" :item="editingItem" @saved="() => tableRef?.refresh()" />
    <!-- + a delete-confirmation UModal -->
  </ClientOnly>
</template>
```

```ts
const tableRef = useTemplateRef('tableRef')
const panelOpen = ref(false)
const editingItem = ref<Athlete | null>(null)

const columns = computed(() => [
  { accessorKey: 'full_name', header: t('athlete.firstName') },
  { accessorKey: 'birth_date', header: t('athlete.birthDate') },
  // …
  { id: 'actions', header: '' },
])

function openCreate() { editingItem.value = null;  panelOpen.value = true }  // create
function openEdit(i)  { editingItem.value = i;     panelOpen.value = true }  // edit
```

Three recurring details:

- **`item === null` ⇒ create, `item !== null` ⇒ edit.** The same panel serves both cases.
- **`<column>-cell` slots** render custom cells (formatted dates, status badges, action buttons).
- **`<ClientOnly>`** wraps the panel: it renders only in the browser, avoiding hydration issues with overlay components.
- After `@saved`, the page calls `tableRef.refresh()` to re-read the list.

## Inside `DataTable`

[`app/components/DataTable.vue`](../../app/components/DataTable.vue) is the workhorse. Highlights:

```ts
const { data, refresh, status } = useLazyAsyncData(
  `data-table-${instanceId}`,                       // key unique per instance
  () => api.get<{ data: T[], meta: {…} }>(props.url, {
    page: page.value,
    per_page: selectedPageSize.value,
    search: search.value || undefined,
    paginate: 1,
    ...props.params,                                 // extra filters from the page
  }),
)
```

- **Generic**: `<script setup lang="ts" generic="T extends Record<string, unknown>">` — the table knows nothing about the data type; it receives it from the columns.
- **Debounced search**: the search input updates `search` only after a 300 ms pause (lines 118-128), so the API isn't hammered on every keystroke. Changing the search resets to page 1.
- **Pagination**: `page` and `selectedPageSize` are watched; the fetch re-runs when they change. Possible page sizes are `PAGE_SIZES = [10, 20, 50, 100]` from [`constants.ts`](../../app/utils/constants.ts).
- **`props.params` with `deep: true`**: if the page passes extra filters (e.g. `tournament_id`), a change resets to page 1 and re-reads.
- **`defineExpose({ refresh, total, pending })`**: this is how the parent page can call `tableRef.refresh()`.
- **Slot pass-through**: all slots defined on the page (except `empty` and `filters`) are forwarded to `UTable`, enabling the `<column>-cell` custom cells.

## Inside a `*FormPanel`

[`app/components/panels/AthleteFormPanel.vue`](../../app/components/panels/AthleteFormPanel.vue) shows the pattern shared by all panels:

1. **`open` as `defineModel`**: `const open = defineModel<boolean>()` — the panel is opened/closed via `v-model` from the parent.
2. **Loading in edit mode**: a `watch(open)` (lines 145-175) fires when it opens; in edit mode it does a `GET /api/admin/athletes/{id}` to populate `state` with fresh data; otherwise it clears the fields.
3. **Zod schema + `<UForm>`**: per-field validation (see [Chapter 06](06-data-flow-api.md)).
4. **`onSubmit`**: builds the `body`, calls `put` (edit) or `post` (create), shows a toast, emits `saved`. Empty fields are normalised to `null` (`team_name: event.data.team_name || null`).
5. **Error handling**: in the `catch`, `getApiErrorMessage(e)` surfaces the backend's message.

## Inside `ApiSelectMenu`

[`app/components/ApiSelectMenu.vue`](../../app/components/ApiSelectMenu.vue) is the "smart" select used in forms to pick related resources. Features:

- **Server-side debounced search** (300 ms): type, and the list filters by querying the endpoint.
- **Infinite scroll**: an `IntersectionObserver` (≈ a sentinel that signals when an element comes into view) on a sentinel element at the bottom of the list increments the page and appends the new results (lines 182-204).
- **Label resolution in edit mode**: if the parent sets `modelValue` before the popover is even opened, a `watch` (lines 220-228) does a silent fetch to resolve the label to display.
- **Form integration**: it uses `useFormField()` to emit `change/blur/focus`, so @nuxt/ui can clear validation errors after selection.
- `paginated` mode (default, `{ data, meta }` response) or flat mode (`{ data }` with `paginate: 0`).

## Flow recap

```
[Page]  defines columns, state, handlers
   │  v-model:open ⇆ panelOpen
   ▼
[FormPanel]  opens → (edit) GET to populate → validate (Zod) → POST/PUT
   │  emit('saved')
   ▼
[Page]  tableRef.refresh()
   ▼
[DataTable]  useLazyAsyncData re-reads → UTable re-renders
```
