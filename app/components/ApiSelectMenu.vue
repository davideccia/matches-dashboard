<template>
  <UPopover
    v-model:open="open"
    :disabled="disabled"
    class="flex-1 min-w-0"
  >
    <!-- Trigger -->
    <UButton
      variant="outline"
      color="neutral"
      class="w-full justify-between font-normal"
      :disabled="disabled"
      trailing-icon="i-mdi-unfold-more-vertical"
    >
      <span :class="selectedLabel ? 'text-default' : 'text-muted'">
        {{ selectedLabel ?? placeholder ?? t('common.search') }}
      </span>
    </UButton>

    <!-- Dropdown content -->
    <template #content>
      <div class="w-[min(18rem,calc(100vw-1rem))] p-2">
        <!-- Search input -->
        <UInput
          v-model="search"
          icon="i-mdi-magnify"
          :placeholder="t('common.search')"
          autofocus
          class="w-full"
        />

        <!-- List -->
        <div class="max-h-60 overflow-y-auto mt-1 space-y-px">
          <div
            v-for="item in items"
            :key="String(item[valueKey])"
            class="flex items-center justify-between gap-2 rounded px-2 py-1.5 cursor-pointer select-none text-sm"
            :class="String(item[valueKey]) === modelValue
              ? 'bg-primary/10 text-primary font-medium'
              : 'hover:bg-elevated text-default'"
            @click="select(item)"
          >
            <span class="truncate">
              <slot name="label" :item="item">
                {{ item[labelKey] }}
              </slot>
            </span>
            <UIcon
              v-if="String(item[valueKey]) === modelValue"
              name="i-mdi-check"
              class="shrink-0 size-4"
            />
          </div>

          <!-- Loading skeletons -->
          <template v-if="loading">
            <div
              v-for="n in 3"
              :key="n"
              class="px-2 py-1.5"
            >
              <USkeleton class="h-4 w-full rounded" />
            </div>
          </template>

          <!-- Infinite scroll sentinel -->
          <div ref="sentinel" class="h-px" />

          <!-- Empty state -->
          <div
            v-if="!loading && items.length === 0"
            class="flex flex-col items-center gap-1.5 py-8 text-muted"
          >
            <UIcon name="i-mdi-magnify-remove-outline" class="size-6 opacity-40" />
            <span class="text-xs">{{ t('common.noResults') }}</span>
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
type Item = Record<string, unknown>

const props = withDefaults(defineProps<{
  modelValue: string | null
  endpoint: string
  valueKey?: string
  labelKey?: string
  placeholder?: string
  disabled?: boolean
  queryParams?: Record<string, string | number | boolean | undefined>
}>(), {
  valueKey: 'id',
  labelKey: 'label',
  placeholder: undefined,
  disabled: false,
  queryParams: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  'select': [item: Record<string, unknown>]
}>()

const { t } = useI18n()
const api = useApi()

// ── Form field integration (clears validation errors after selection) ──────
const { emitFormChange, emitFormBlur, emitFormFocus } = useFormField()

// ── State ──────────────────────────────────────────────────────────────────
const open = ref(false)
const search = ref('')
const items = ref<Item[]>([])
const loading = ref(false)
const currentPage = ref(1)
const hasMore = ref(false)

const PAGE_SIZE = 20

// ── Derived ────────────────────────────────────────────────────────────────
const selectedItem = computed(() =>
  items.value.find(i => String(i[props.valueKey]) === props.modelValue) ?? null,
)

const selectedLabel = computed(() => {
  if (!selectedItem.value) { return null }
  return String(selectedItem.value[props.labelKey] ?? '')
})

// ── API ────────────────────────────────────────────────────────────────────
interface PaginatedResponse {
  data: Item[]
  meta: { total: number, current_page: number, last_page: number, per_page: number }
}

async function fetchItems(append = false) {
  if (loading.value) { return }
  loading.value = true
  try {
    const res = await api.get<PaginatedResponse>(props.endpoint, {
      paginate: 1,
      page: currentPage.value,
      per_page: PAGE_SIZE,
      ...(search.value ? { search: search.value } : {}),
      ...(props.queryParams ?? {}),
    })
    const fetched = res.data ?? []
    items.value = append ? [...items.value, ...fetched] : fetched
    hasMore.value = currentPage.value < (res.meta?.last_page ?? 1)
  } catch {
    // silent – api errors handled upstream
  } finally {
    loading.value = false
  }
}

function select(item: Item) {
  emit('update:modelValue', String(item[props.valueKey]))
  emit('select', item)
  emitFormChange()
  open.value = false
}

// ── Infinite scroll ────────────────────────────────────────────────────────
const sentinel = useTemplateRef('sentinel')
let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    const entry = entries[0]
    if (entry?.isIntersecting && !loading.value && hasMore.value) {
      currentPage.value++
    }
  }, { threshold: 0.1 })
})

watch(sentinel, (el) => {
  observer?.disconnect()
  if (el) { observer?.observe(el) }
})

watch(currentPage, (page) => {
  if (page > 1) {
    fetchItems(true)
  }
})

// ── Search debounce ────────────────────────────────────────────────────────
let searchTimer: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    items.value = []
    fetchItems()
  }, 300)
})

// ── Resolve label when modelValue is pre-set (edit mode) ──────────────────
// items is empty until the popover opens, so if the parent sets modelValue
// before the first open we fetch the first page silently to resolve the label.
watch(
  () => props.modelValue,
  async (val) => {
    if (val !== null && val !== undefined && items.value.length === 0) {
      await fetchItems()
    }
  },
  { immediate: true },
)

// ── queryParams change → reset and re-fetch ────────────────────────────────
watch(
  () => props.queryParams,
  () => {
    currentPage.value = 1
    items.value = []
    fetchItems()
  },
  { deep: true },
)

// ── endpoint change → reset and re-fetch ───────────────────────────────────
// Serve agli endpoint nested che dipendono da un'altra selezione (es. le
// discipline di un torneo): senza questo la lista resterebbe quella vecchia.
watch(
  () => props.endpoint,
  () => {
    currentPage.value = 1
    items.value = []
    fetchItems()
  },
)

// ── Popover open/close ─────────────────────────────────────────────────────
watch(open, async (isOpen) => {
  if (isOpen) {
    emitFormFocus()
    currentPage.value = 1
    await fetchItems()
  } else {
    emitFormBlur()
    search.value = ''
    items.value = []
    hasMore.value = false
  }
})

onBeforeUnmount(() => {
  clearTimeout(searchTimer)
  observer?.disconnect()
})
</script>
