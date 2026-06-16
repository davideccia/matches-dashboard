# 06 — The Admin CRUD Pattern

Almost every admin page does the same thing: list records, search them, and create/edit/delete them. **CRUD** = *Create, Read, Update, Delete*. Rather than reinvent this per page, the codebase uses one repeated recipe built from three reusable components. Learn it once and every admin page reads the same way.

The three ingredients:

1. **`DataTable`** — the list (paginated, searchable table).
2. **`*FormPanel`** — a slide-over form for create/edit.
3. **`ApiSelectMenu`** — a searchable dropdown for picking a related record.

We'll walk the athletes page, which is representative. Files: [`app/pages/admin/configurations/athletes.vue`](../../app/pages/admin/configurations/athletes.vue) and [`app/components/AthleteFormPanel.vue`](../../app/components/AthleteFormPanel.vue).

## Ingredient 1 — `DataTable`

[`app/components/DataTable.vue`](../../app/components/DataTable.vue) is a generic table. You give it a `url` and `columns`; it does the rest:

```vue
<DataTable
  ref="tableRef"
  url="/api/admin/athletes"
  :columns="columns"
  empty-icon="i-mdi-account"
>
  <template #birth_date-cell="{ row }">
    {{ formatServerDateOnly(row.original.birth_date, locale) }}
  </template>
  <template #actions-cell="{ row }">
    <UButton icon="i-mdi-pencil" @click="openEdit(row.original)" />
    <UButton icon="i-mdi-delete" @click="confirmDelete(row.original)" />
  </template>
</DataTable>
```

What it handles internally (read the component to confirm):

- **Fetching** via [`useApi().get()`](07-data-flow-api.md) wrapped in `useLazyAsyncData` (≈ Nuxt's "fetch this and give me `data`/`status`/`refresh`" helper). It sends `page`, `per_page`, `search`, `paginate: 1` plus any extra `params` you pass.
- **Pagination** — a `UPagination` control and a rows-per-page `USelect` (options from `PAGE_SIZES` in `constants.ts`).
- **Search** — an optional search box (`searchable`, on by default) that **debounces** input by 300 ms (≈ waits until you stop typing before firing the request) and resets to page 1.
- **Empty / loading states** — a default empty illustration and per-row loading.
- **Custom cells via slots** — any `#<columnKey>-cell` slot lets the parent render that column however it likes (formatting dates, mapping enums to labels, action buttons).

Crucially it exposes a `refresh()` method via `defineExpose`. The parent grabs a `ref` to the table (`tableRef`) and calls `tableRef.refresh()` after any create/edit/delete to reload the list.

The parent page defines the `columns` as a computed array (so headers re-translate when the locale changes):

```ts
const columns = computed(() => [
  { accessorKey: 'full_name', header: t('athlete.firstName') },
  { accessorKey: 'birth_date', header: t('athlete.birthDate') },
  { accessorKey: 'gender', header: t('athlete.gender.label') },
  { id: 'actions', header: '' },
])
```

## Ingredient 2 — `*FormPanel`

Each resource has its own panel (e.g. [`AthleteFormPanel.vue`](../../app/components/AthleteFormPanel.vue)). It is a `USlideover` (≈ a panel that slides in from the screen edge) wrapping a `UForm`. The contract:

- **Props**: `item` — the record to edit, or `null` to create. A `v-model` boolean controls open/closed.
- **Emits**: `saved` — fired after a successful create or update.
- **Validation**: a **Zod** schema (`z.object({...})`) passed to `UForm`. The form won't submit until the data satisfies it. Example from the athlete panel:

  ```ts
  const schema = z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    birth_date: z.string().min(1),
    gender: z.enum(GENDERS),
    tax_number: z.string().min(1),
    team_name: z.string().optional(),
    default_weight_category_id: z.string().nullish(),
    default_discipline_id: z.string().nullish(),
  })
  ```

- **Local form state** is a `reactive({...})` object, populated from `props.item` when the panel opens (a `watch(open, …)` copies the item's fields in, or resets for create mode).
- **Submit** decides create vs update by whether `item` is null:

  ```ts
  if (isEdit.value) await api.put(`/api/admin/athletes/${props.item!.id}`, body)
  else               await api.post('/api/admin/athletes', body)
  open.value = false
  emit('saved')
  toast.add({ title: ..., color: 'success' })   // user feedback
  ```

- **Errors** are surfaced with a toast using `getApiErrorMessage(e)` (a helper in `useApi.ts` that digs the backend's `message` out of the error). See [Chapter 07](07-data-flow-api.md).

## Ingredient 3 — `ApiSelectMenu`

When a form field is a *reference to another record* (an athlete's default weight category, say), you don't want a giant hardcoded `<select>`. [`ApiSelectMenu.vue`](../../app/components/ApiSelectMenu.vue) is a popover dropdown that fetches its options from an endpoint:

```vue
<ApiSelectMenu
  v-model="state.default_weight_category_id"
  endpoint="/api/admin/weight_categories"
  label-key="label"
  :placeholder="t('athlete.noCategory')"
/>
```

Features worth knowing:

- **Server-side search** — typing in the box (debounced 300 ms) re-queries the endpoint with `search=…`.
- **Infinite scroll** — it watches a sentinel element with an `IntersectionObserver` (≈ "tell me when this element scrolls into view") and loads the next page when you reach the bottom. Set `:paginated="false"` to fetch everything flat instead.
- **Pre-selected value resolution** — in edit mode the field already has an id but no loaded options; the component silently fetches the first page so it can display the right label.
- **Form integration** — it calls `useFormField()`'s `emitFormChange/Blur/Focus` so the surrounding `UForm` clears validation errors correctly when you pick something.

## The whole page wired together

The parent page (`athletes.vue`) ties the three together:

```ts
const tableRef   = useTemplateRef('tableRef')
const panelOpen  = ref(false)
const editingItem = ref<Athlete | null>(null)

function openCreate() { editingItem.value = null; panelOpen.value = true }
function openEdit(i)  { editingItem.value = i;    panelOpen.value = true }
```

```vue
<ClientOnly>
  <AthleteFormPanel v-model="panelOpen" :item="editingItem" @saved="() => tableRef?.refresh()" />
  <UModal v-model:open="confirmOpen" :title="t('common.confirm')"> … delete confirmation … </UModal>
</ClientOnly>
```

The flow:

1. "Add" button → `openCreate()` → panel opens in create mode.
2. Row pencil → `openEdit(row)` → panel opens pre-filled.
3. Panel saves → emits `saved` → parent calls `tableRef.refresh()` → list reloads.
4. Row trash → opens a `UModal` confirmation → `deleteItem()` calls `api.del(...)` then refreshes.

> [!TIP]
> Every admin resource (`tournaments`, `disciplines`, `weight_categories`, `users`, `registrations`) follows this exact shape. To add a new one, copy an existing page + its FormPanel, swap the endpoint, columns, and Zod schema, and add the sidebar entry in [`layouts/default.vue`](../../app/layouts/default.vue). (The repo even ships a `nuxt-admin-crud` skill that scaffolds this.)
