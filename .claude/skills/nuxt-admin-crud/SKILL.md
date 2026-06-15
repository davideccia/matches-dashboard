---
name: nuxt-admin-crud
description: Implements a full CRUD page for the matches-dashboard admin panel (Nuxt 3 + @nuxt/ui v4). Given a resource name, API base path, field definitions, and sidebar position, generates the list page with paginated table + search, the USlideover form panel component, i18n keys, and wires the sidebar entry — following the exact patterns from the users CRUD implementation. Use when asked to add a new admin section, create a new CRUD resource page, or replicate the users pattern for another entity.
---

# nuxt-admin-crud

Generates a complete CRUD admin section matching the users implementation pattern.

## What gets created

1. `app/pages/admin/<group>/<resource>.vue` — list page
2. `app/components/<Resource>FormPanel.vue` — USlideover form
3. i18n keys in `i18n/locales/en.json` and `i18n/locales/it.json`
4. Sidebar entry in `app/layouts/default.vue`

## Workflow

### Step 1 — Gather inputs from the user

Ask the user for (or extract from their message):

- **Resource name** (singular, e.g. `tournament`, `club`) — used for component name, i18n namespace, type name
- **API base path** — e.g. `/api/desktop/tournaments`
- **Fields** — list of `{ name, type, zod, label, inputType?, required?, editOptional? }`
- **Sidebar group** — which `children[]` array to add the item to (e.g. `configurations`, `management`). If the group doesn't exist yet, add it.
- **Sidebar icon** — lucide icon for the nav entry
- **Complications** — any field that needs special treatment (select, date picker, relation, etc.)

### Step 2 — Generate the list page

File: `app/pages/admin/<group>/<resource-plural>.vue`

```vue
<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { <Resource> } from '~~/components/<Resource>FormPanel.vue'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const api = useApi()
const toast = useToast()
const { user: currentUser } = useAuth()   // remove if delete-self guard not needed

const page = ref(1)
const searchInput = ref('')
const search = ref('')
const panelOpen = ref(false)
const editingItem = ref<<Resource> | null>(null)
const confirmOpen = ref(false)
const deleteTarget = ref<<Resource> | null>(null)
const deleting = ref(false)

let searchTimer: ReturnType<typeof setTimeout>
watch(searchInput, (val) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { search.value = val; page.value = 1 }, 300)
})

interface PageResponse {
  content: <Resource>[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

interface <Resource>sResponse {
  data: PageResponse
}

const pageSize = 20

const { data, refresh, status } = useLazyAsyncData(
  '<resource-plural>',
  () => api.get<<Resource>sResponse>('<API_BASE_PATH>', {
    page: page.value - 1,
    size: pageSize,
    ...(search.value ? { search: search.value } : {}),
  }),
  { watch: [page, search] },
)

const items = computed(() => data.value?.data?.content ?? [])
const total = computed(() => data.value?.data?.totalElements ?? 0)

const columns = computed<TableColumn<<Resource>>[]>(() => [
  // Add one entry per visible field:
  { accessorKey: '<fieldKey>', header: t('<resource>.<fieldKey>') },
  { id: 'actions', header: '' },
])

function openCreate() { editingItem.value = null; panelOpen.value = true }
function openEdit(item: <Resource>) { editingItem.value = item; panelOpen.value = true }
function confirmDelete(item: <Resource>) { deleteTarget.value = item; confirmOpen.value = true }

async function deleteItem() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await api.del(`<API_BASE_PATH>/${deleteTarget.value.id}`)
    confirmOpen.value = false
    deleteTarget.value = null
    await refresh()
    toast.add({ title: t('<resource>.deleted'), color: 'success' })
  } catch {
    toast.add({ title: t('common.error'), color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('nav.<resource-plural>')">
        <template #leading><UDashboardSidebarCollapse /></template>
        <template #right>
          <UButton icon="i-lucide-plus" @click="openCreate">{{ t('common.add') }}</UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-5 p-6">
        <div class="flex items-center justify-between">
          <UInput v-model="searchInput" icon="i-lucide-search" :placeholder="t('common.search')" class="w-64" />
          <UBadge v-if="total > 0" variant="soft" color="neutral" size="md">{{ total }}</UBadge>
        </div>

        <div class="ring-1 ring-default rounded-xl overflow-hidden">
          <UTable
            :data="items"
            :columns="columns"
            :loading="status === 'pending'"
            :ui="{ tr: 'border-b border-default last:border-0 odd:bg-default even:bg-elevated' }"
          >
            <template #empty>
              <div class="flex flex-col items-center gap-2 py-12 text-muted">
                <UIcon name="i-lucide-<resource-icon>" class="size-8 opacity-40" />
                <span class="text-sm">{{ t('common.noResults') }}</span>
              </div>
            </template>
            <!-- Add custom cell templates for dates or formatted fields:
            <template #createdAt-cell="{ row }">
              {{ new Date(row.original.createdAt).toLocaleDateString() }}
            </template>
            -->
            <template #actions-cell="{ row }">
              <div class="flex justify-end gap-1">
                <UButton icon="i-lucide-pencil" variant="ghost" color="neutral" size="sm" @click="openEdit(row.original)" />
                <UButton icon="i-lucide-trash-2" variant="ghost" color="error" size="sm" @click="confirmDelete(row.original)" />
              </div>
            </template>
          </UTable>
        </div>

        <div class="flex min-h-10 justify-end">
          <UPagination v-if="total > pageSize" v-model:page="page" :total="total" :items-per-page="pageSize" />
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <ClientOnly>
    <Resource>FormPanel v-model="panelOpen" :item="editingItem" @saved="refresh" />

    <UModal v-model:open="confirmOpen" :title="t('common.confirm')">
      <template #body>
        <p class="text-sm text-muted">{{ t('<resource>.deleteConfirm') }}</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="confirmOpen = false">{{ t('common.cancel') }}</UButton>
          <UButton color="error" :loading="deleting" @click="deleteItem">{{ t('common.delete') }}</UButton>
        </div>
      </template>
    </UModal>
  </ClientOnly>
</template>
```

### Step 3 — Generate the form panel component

File: `app/components/<Resource>FormPanel.vue`

```vue
<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

export interface <Resource> {
  id: string
  // one line per field from the field list
  <fieldName>: <tsType>
}

const props = defineProps<{ item: <Resource> | null }>()
const emit = defineEmits<{ saved: [] }>()
const open = defineModel<boolean>({ default: false })

const { t } = useI18n()
const api = useApi()
const toast = useToast()

const isEdit = computed(() => props.item !== null)

// For fields that are mandatory on create but optional on edit (like password):
const createSchema = z.object({ /* required fields */ })
const editSchema = z.object({ /* relaxed fields */ })
const schema = computed(() => isEdit.value ? editSchema : createSchema)

const state = reactive({ /* one key per field, initialized to '' or null */ })

watch(open, (val) => {
  if (val) {
    // populate state from props.item or reset
  }
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<z.infer<typeof createSchema>>) {
  loading.value = true
  try {
    const body = { /* map event.data → API body, omit optional empty fields */ }
    if (isEdit.value) {
      await api.put(`<API_BASE_PATH>/${props.item!.id}`, body)
    } else {
      await api.post('<API_BASE_PATH>', body)
    }
    open.value = false
    emit('saved')
    toast.add({ title: t(isEdit.value ? '<resource>.updated' : '<resource>.created'), color: 'success' })
  } catch {
    toast.add({ title: t('common.error'), color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <USlideover v-model:open="open" :title="isEdit ? t('<resource>.editTitle') : t('<resource>.createTitle')">
    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-6 p-6" @submit="onSubmit">
        <!-- UFormField per each field -->
        <UFormField name="<field>" :label="t('<resource>.<field>')" required>
          <UInput v-model="state.<field>" class="w-full" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton variant="ghost" color="neutral" type="button" @click="open = false">{{ t('common.cancel') }}</UButton>
          <UButton type="submit" :loading="loading">{{ t('common.save') }}</UButton>
        </div>
      </UForm>
    </template>
  </USlideover>
</template>
```

### Step 4 — Add i18n keys

Add to `i18n/locales/en.json` and `i18n/locales/it.json` under a `"<resource>"` namespace:

```json
"<resource>": {
  "<fieldName>": "Field Label",
  "createTitle": "New <Resource>",
  "editTitle": "Edit <Resource>",
  "deleteConfirm": "Are you sure you want to delete this <resource>?",
  "created": "<Resource> created",
  "updated": "<Resource> updated",
  "deleted": "<Resource> deleted"
}
```

Also add `"<resource-plural>"` to `"nav"` for the sidebar label.

### Step 5 — Add sidebar entry in `app/layouts/default.vue`

In the `items` computed array, add to the appropriate `children[]` group:

```ts
{
  label: t('nav.<resource-plural>'),
  icon: 'i-lucide-<icon>',
  to: localePath('/admin/<group>/<resource-plural>'),
},
```

If a new top-level group is needed:

```ts
{
  label: t('nav.<groupName>'),
  icon: 'i-lucide-<group-icon>',
  children: [/* items */],
},
```

## API response shape

The list endpoint is expected to return:

```json
{
  "data": {
    "content": [ { "id": "...", /* fields */ } ],
    "totalElements": 42,
    "totalPages": 3,
    "size": 20,
    "number": 0
  }
}
```

- `page` is 0-indexed in the query param (`page.value - 1`)
- `search` is optional; omit the key if empty (use spread conditional)
- Single item endpoints: `GET /…/:id`, `POST /…`, `PUT /…/:id`, `DELETE /…/:id`

## Special field patterns

| Field type | Input component | Zod rule | Notes |
|---|---|---|---|
| Text | `UInput` | `z.string().min(1)` | Default |
| Email | `UInput type="email"` | `z.email()` | |
| Password (create required, edit optional) | `UInput type="password" autocomplete="new-password"` | create: `z.string().min(6)`, edit: `z.union([z.string().min(6), z.literal('')])` | omit from body if empty |
| Select / enum | `USelect :options="[…]"` | `z.enum([…])` | define options array in script |
| Date | `UInput type="date"` | `z.string()` | format before sending if API expects ISO |
| Number | `UInput type="number"` | `z.coerce.number()` | |
| Textarea | `UTextarea` | `z.string()` | |
| Boolean | `UToggle` | `z.boolean()` | |

## Self-delete guard

When a resource is "users" or similar, prevent deleting the currently logged-in user:

```html
<UButton
  v-if="row.original.id !== currentUser?.id"
  icon="i-lucide-trash-2"
  …
/>
```

## Key conventions

- `panelOpen` / `editingItem` — controls the USlideover; `null` means create mode
- `confirmOpen` / `deleteTarget` — controls the delete UModal
- All API calls wrapped in try/catch with `toast.add` for both success and error
- `useLazyAsyncData` with `watch: [page, search]` for reactive refetch
- Search debounced 300ms via `searchTimer`
- Table wrapped in `ring-1 ring-default rounded-xl overflow-hidden`
- Pagination only shown when `total > pageSize`
- Form panel and modal always inside `<ClientOnly>`
