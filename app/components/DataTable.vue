<template>
  <div class="flex flex-col gap-4">
    <div class="border-2 border-accented rounded-xl p-4 flex flex-col gap-2">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1 p-2">
        <div class="flex flex-wrap items-center gap-2">
          <template v-if="bulkActions?.length">
            <UDropdownMenu :items="bulkActionItems">
              <UButton
                :label="t('common.actions')"
                trailing-icon="i-mdi-chevron-down"
                variant="outline"
                color="neutral"
                size="sm"
                :disabled="selectedIds.length === 0"
              />
            </UDropdownMenu>
            <USeparator orientation="vertical" class="h-5" />
            <UBadge variant="soft" color="primary" size="md">
              {{ selectedIds.length }} {{ t('common.selected') }}
            </UBadge>
          </template>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <UButton
            icon="i-mdi-refresh"
            variant="ghost"
            color="neutral"
            :loading="loading"
            :aria-label="t('common.refresh')"
            @click="refresh()"
          />
          <UInput
            v-if="searchable"
            v-model="searchInput"
            icon="i-mdi-magnify"
            :placeholder="searchPlaceholder ?? t('common.search')"
            class="w-full sm:w-64"
          />
        </div>
      </div>

      <div v-if="$slots.filters" class="flex flex-col gap-2 rounded-lg bg-elevated/50 border border-accented px-3 py-2">
        <div class="flex flex-wrap items-center gap-2">
          <slot name="filters" />
        </div>
      </div>

      <div class="ring-2 ring-accented rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <UTable
            ref="tableRef"
            v-model:row-selection="rowSelection"
            :data="items"
            :columns="alignedColumns"
            :loading="loading"
            :ui="{ tr: 'border-b border-default last:border-0 odd:bg-default even:bg-elevated' }"
          >
            <template #empty>
              <slot name="empty">
                <div class="flex flex-col items-center gap-2 py-12 text-muted">
                  <UIcon :name="emptyIcon" class="size-8 opacity-40" />
                  <span class="text-sm">{{ emptyText ?? t('common.noResults') }}</span>
                </div>
              </slot>
            </template>
            <template v-for="name in Object.keys($slots).filter(n => n !== 'empty' && n !== 'filters')" :key="name" #[name]="slotProps">
              <slot :name="name" v-bind="slotProps ?? {}" />
            </template>
          </UTable>
        </div>
      </div>

      <div class="flex min-h-10 flex-wrap items-center justify-between gap-2 px-1">
        <div class="flex items-center gap-2">
          <UBadge v-if="showTotal" variant="outline" color="neutral" size="md">
            Tot. {{ total }}
          </UBadge>
        </div>
        <div class="flex items-center gap-2 text-sm text-muted">
          <span>{{ t('common.rowsPerPage') }}</span>
          <USelect
            v-model="selectedPageSize"
            :items="pageSizeOptions"
            size="sm"
            class="w-20"
          />
          <USeparator v-if="total > selectedPageSize" orientation="vertical" class="h-5" />
          <UPagination
            v-if="total > selectedPageSize"
            v-model:page="page"
            :total="total"
            :items-per-page="selectedPageSize"
          />
        </div>
      </div>
    </div>
  </div>

  <UModal v-model:open="confirmBulkOpen" :title="t('common.confirm')">
    <template #body>
      <p class="text-sm text-muted">
        {{ pendingBulkAction?.label }}: {{ selectedIds.length }} {{ t('common.selected') }}
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" color="neutral" @click="confirmBulkOpen = false">
          {{ t('common.cancel') }}
        </UButton>
        <UButton color="error" :loading="bulkExecuting" @click="executeBulkAction">
          {{ t('common.confirm') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import { h, resolveComponent } from 'vue'
import { getApiErrorMessage } from '~/composables/useApi'
import { PAGE_SIZES } from '~/utils/constants'

type QueryParams = Record<string, string | number | boolean | undefined>

interface BulkAction {
  endpoint: string
  icon: string
  label: string
  ids_key: string
  method?: 'POST' | 'DELETE'
  color?: string
}

const props = withDefaults(defineProps<{
  url: string
  columns: TableColumn<T>[]
  params?: QueryParams
  pageSize?: number
  emptyIcon?: string
  emptyText?: string
  searchable?: boolean
  showTotal?: boolean
  searchPlaceholder?: string
  bulkActions?: BulkAction[]
}>(), {
  pageSize: 10,
  emptyIcon: 'i-mdi-database',
  searchable: true,
  showTotal: true,
})

const { t } = useI18n()
const api = useApi()
const toast = useToast()

const instanceId = getCurrentInstance()?.uid ?? Math.random()
const page = ref(1)
const tableRef = useTemplateRef<any>('tableRef')
const rowSelection = ref<Record<string, boolean>>({})

const UCheckbox = resolveComponent('UCheckbox')
const selectColumn: TableColumn<T> = {
  id: 'select',
  header: ({ table }: { table: { getIsSomePageRowsSelected: () => boolean, getIsAllPageRowsSelected: () => boolean, toggleAllPageRowsSelected: (v: boolean) => void } }) => h(UCheckbox, {
    'modelValue': table.getIsSomePageRowsSelected() ? 'indeterminate' : table.getIsAllPageRowsSelected(),
    'onUpdate:modelValue': (v: boolean) => table.toggleAllPageRowsSelected(!!v),
    'aria-label': 'Select all',
  }),
  cell: ({ row }: { row: { getIsSelected: () => boolean, toggleSelected: (v: boolean) => void } }) => h(UCheckbox, {
    'modelValue': row.getIsSelected(),
    'onUpdate:modelValue': (v: boolean) => row.toggleSelected(!!v),
    'aria-label': 'Select row',
  }),
}
const pageSizeOptions = [...PAGE_SIZES]
const selectedPageSize = ref<typeof PAGE_SIZES[number]>(props.pageSize as typeof PAGE_SIZES[number])

const searchInput = ref('')
const search = ref('')
let searchTimer: ReturnType<typeof setTimeout>

const { data, refresh, status } = useLazyAsyncData(
  `data-table-${instanceId}`,
  () => api.get<{ data: T[], meta: { total: number, current_page: number, last_page: number, per_page: number } }>(props.url, {
    page: page.value,
    per_page: selectedPageSize.value,
    search: search.value || undefined,
    paginate: 1,
    ...props.params,
  }),
)

watch(searchInput, (val) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    search.value = val
    if (page.value !== 1) {
      page.value = 1
    } else {
      refresh()
    }
  }, 300)
})

watch(page, () => refresh())

watch(selectedPageSize, () => {
  if (page.value !== 1) {
    page.value = 1
  } else {
    refresh()
  }
})

watch(() => props.params, () => {
  if (page.value !== 1) {
    page.value = 1
  } else {
    refresh()
  }
}, { deep: true })

const items = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.meta?.total ?? 0)
const alignedColumns = computed(() => [
  selectColumn,
  ...props.columns.map(col => ({
    ...col,
    meta: col.meta ?? { class: { th: 'text-left', td: 'text-left' } },
  })),
])
const loading = computed(() => status.value === 'pending' || status.value === 'idle')

watch(items, () => { rowSelection.value = {} })

const selectedIds = computed(() =>
  (tableRef.value as any)?.tableApi?.getFilteredSelectedRowModel().rows.map((r: { original: { id: string | number } }) => r.original.id) ?? [],
)

const confirmBulkOpen = ref(false)
const bulkExecuting = ref(false)
const pendingBulkAction = ref<BulkAction | null>(null)

const bulkActionItems = computed<DropdownMenuItem[][]>(() =>
  [(props.bulkActions ?? []).map(action => ({
    label: action.label,
    icon: action.icon,
    color: action.color as DropdownMenuItem['color'],
    onSelect: () => {
      pendingBulkAction.value = action
      confirmBulkOpen.value = true
    },
  }))],
)

async function executeBulkAction() {
  if (!pendingBulkAction.value) { return }
  bulkExecuting.value = true
  try {
    const payload = { [pendingBulkAction.value.ids_key]: selectedIds.value }
    if ((pendingBulkAction.value.method ?? 'POST') === 'DELETE') {
      await api.del(pendingBulkAction.value.endpoint, undefined, payload)
    } else {
      await api.post(pendingBulkAction.value.endpoint, payload)
    }
    confirmBulkOpen.value = false
    rowSelection.value = {}
    refresh()
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e), color: 'error' })
  } finally {
    bulkExecuting.value = false
  }
}

defineExpose({
  refresh,
  get selectedIds() { return selectedIds.value },
  get total() { return total.value },
  get pending() { return loading.value },
})
</script>
