<template>
  <div class="flex flex-col gap-4">
    <div class="bg-elevated rounded-xl p-2 flex flex-col gap-2">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
        <div class="flex flex-wrap items-center gap-2">
          <UInput
            v-if="searchable"
            v-model="searchInput"
            icon="i-mdi-magnify"
            :placeholder="searchPlaceholder ?? t('common.search')"
            class="w-full sm:w-64"
          />
          <slot name="filters" />
          <UButton
            icon="i-mdi-refresh"
            variant="ghost"
            color="neutral"
            :loading="loading"
            :aria-label="t('common.refresh')"
            @click="refresh()"
          />
        </div>
        <UBadge v-if="showTotal && total > 0" variant="soft" color="neutral" size="md">
          {{ total }}
        </UBadge>
      </div>

      <div class="ring-2 ring-accented rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <UTable
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

      <div class="flex min-h-10 items-center justify-between px-1">
        <div class="flex items-center gap-2 text-sm text-muted">
          <span>{{ t('common.rowsPerPage') }}</span>
          <USelect
            v-model="selectedPageSize"
            :items="pageSizeOptions"
            size="sm"
            class="w-20"
          />
        </div>
        <UPagination
          v-if="total > selectedPageSize"
          v-model:page="page"
          :total="total"
          :items-per-page="selectedPageSize"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { TableColumn } from '@nuxt/ui'
import { PAGE_SIZES } from '~/utils/constants'

type QueryParams = Record<string, string | number | boolean | undefined>

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
}>(), {
  pageSize: 10,
  emptyIcon: 'i-mdi-database',
  searchable: true,
  showTotal: true,
})

const { t } = useI18n()
const api = useApi()

const instanceId = getCurrentInstance()?.uid ?? Math.random()
const page = ref(1)
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
const alignedColumns = computed(() =>
  props.columns.map(col => ({
    ...col,
    meta: col.meta ?? { class: { th: 'text-left', td: 'text-left' } },
  })),
)
const loading = computed(() => status.value === 'pending' || status.value === 'idle')

defineExpose({
  refresh,
  get total() { return total.value },
  get pending() { return loading.value },
})
</script>
