<template>
  <div
    class="rounded-md border bg-default"
    :class="highlight ? 'border-error' : 'border-accented'"
    @focusin="emitFormFocus"
    @focusout="emitFormBlur"
  >
    <!-- Search input (fissa, non scrolla) -->
    <div v-if="searchable" class="border-b border-default p-2">
      <UInput
        v-model="search"
        icon="i-mdi-magnify"
        :placeholder="placeholder ?? t('common.search')"
        :disabled="isDisabled"
        class="w-full"
      />
    </div>

    <!-- Area scrollabile ad altezza fissa: non cresce col numero di elementi -->
    <div ref="scroller" class="overflow-y-auto p-2" :class="height">
      <!-- Errore -->
      <div
        v-if="error"
        class="flex flex-col items-center gap-1.5 py-8 text-error"
      >
        <UIcon name="i-mdi-alert-circle-outline" class="size-6 opacity-60" />
        <span class="px-2 text-center text-xs">{{ error }}</span>
        <UButton
          type="button"
          size="xs"
          variant="ghost"
          color="neutral"
          @click="reload"
        >
          {{ t("common.refresh") }}
        </UButton>
      </div>

      <template v-else>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="item in displayItems"
            :key="idOf(item)"
            as="button"
            type="button"
            size="lg"
            :color="isSelected(item) ? 'primary' : 'neutral'"
            :variant="isSelected(item) ? 'solid' : 'subtle'"
            :disabled="isDisabled || isBlockedByMax(item)"
            :aria-pressed="isSelected(item)"
            class="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            @click="toggle(item)"
          >
            <span class="flex items-center gap-1">
              <UIcon
                v-if="isSelected(item)"
                name="i-mdi-check"
                class="size-3.5 shrink-0"
              />
              <slot name="label" :item="item" :selected="isSelected(item)">
                {{ labelOf(item) }}
              </slot>
            </span>
          </UBadge>
        </div>

        <!-- Loading skeletons -->
        <div v-if="loading" class="mt-2 flex flex-wrap gap-2">
          <USkeleton v-for="n in 6" :key="n" class="h-6 w-24 rounded-full" />
        </div>

        <!-- Infinite scroll sentinel -->
        <div v-if="paginated" ref="sentinel" class="h-px" />

        <!-- Empty state -->
        <div
          v-if="!loading && displayItems.length === 0"
          class="flex flex-col items-center gap-1.5 py-8 text-muted"
        >
          <UIcon
            name="i-mdi-magnify-remove-outline"
            class="size-6 opacity-40"
          />
          <span class="text-xs">{{ t("common.noResults") }}</span>
        </div>
      </template>
    </div>

    <!-- Footer: contatore + deseleziona tutto -->
    <div
      class="flex items-center justify-between gap-2 border-t border-default px-2 py-1.5 text-xs text-muted"
    >
      <span>
        {{ modelValue.length }}<template v-if="max"> / {{ max }}</template>
        {{ t("common.selected") }}
        <span v-if="isMaxReached" class="text-warning"
          >— {{ t("common.maxSelectionReached") }}</span
        >
      </span>
      <UButton
        v-if="!isDisabled"
        type="button"
        size="xs"
        variant="ghost"
        color="neutral"
        :disabled="!canToggleAll"
        :leading-icon="
          allLoadedSelected
            ? 'i-mdi-checkbox-multiple-blank-outline'
            : 'i-mdi-checkbox-multiple-marked-outline'
        "
        @click="toggleAll"
      >
        {{
          allLoadedSelected ? t("common.clearSelection") : t("common.selectAll")
        }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PaginatedResponse } from "~/types/models";

type Item = Record<string, unknown>;

const props = withDefaults(
  defineProps<{
    endpoint: string;
    valueKey?: string;
    labelKey?: string;
    placeholder?: string;
    disabled?: boolean;
    paginated?: boolean;
    searchable?: boolean;
    /** Altezza fissa dell'area scrollabile (classe Tailwind). */
    height?: string;
    /** Numero massimo di elementi selezionabili. */
    max?: number;
    /**
     * Elementi già noti al parent (relazioni eager-loaded in modifica): servono a
     * risolvere le label degli id selezionati che non sono nella pagina corrente.
     */
    initialItems?: Item[];
    queryParams?: Record<string, string | number | boolean | undefined>;
  }>(),
  {
    valueKey: "id",
    labelKey: "label",
    placeholder: undefined,
    disabled: false,
    paginated: true,
    searchable: true,
    height: "h-30",
    max: undefined,
    initialItems: undefined,
    queryParams: undefined,
  },
);

const emit = defineEmits<{
  change: [items: Item[]];
}>();

const modelValue = defineModel<string[]>({ default: () => [] });

const { t } = useI18n();
const api = useApi();

// ── Form field integration (pulisce gli errori di validazione al toggle) ────
const {
  emitFormChange,
  emitFormBlur,
  emitFormFocus,
  disabled: isDisabled,
  highlight,
} = useFormField(props);

// ── State ──────────────────────────────────────────────────────────────────
const search = ref("");
const items = ref<Item[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const currentPage = ref(1);
const hasMore = ref(false);

/**
 * Label degli elementi selezionati: con ricerca e paginazione un elemento già
 * scelto può non essere nella pagina corrente, senza cache il badge sparirebbe.
 */
const selectedCache = ref(new Map<string, Item>());

const PAGE_SIZE = 20;

// ── Derived ────────────────────────────────────────────────────────────────
const idOf = (item: Item) => String(item[props.valueKey]);
const labelOf = (item: Item) =>
  String(item[props.labelKey] ?? item[props.valueKey] ?? "");

const isSelected = (item: Item) => modelValue.value.includes(idOf(item));

const isMaxReached = computed(
  () => props.max !== undefined && modelValue.value.length >= props.max,
);

const isBlockedByMax = (item: Item) => isMaxReached.value && !isSelected(item);

/** Tutto ciò che è caricato è già selezionato: il pulsante passa a "deseleziona". */
const allLoadedSelected = computed(
  () =>
    modelValue.value.length > 0 &&
    items.value.every((item) => modelValue.value.includes(idOf(item))),
);

const canToggleAll = computed(
  () => items.value.length > 0 || modelValue.value.length > 0,
);

/** Selezionati in cima (sempre visibili), poi i risultati non ancora scelti. */
const displayItems = computed<Item[]>(() => {
  const selected = modelValue.value.map(
    (id) => selectedCache.value.get(id) ?? ({ [props.valueKey]: id } as Item),
  );
  const rest = items.value.filter(
    (item) => !modelValue.value.includes(idOf(item)),
  );
  return [...selected, ...rest];
});

// ── API ────────────────────────────────────────────────────────────────────
/** Memorizza le label degli elementi selezionati che compaiono nei risultati. */
function cacheSelected(fetched: Item[]) {
  const missing = fetched.filter(
    (item) =>
      modelValue.value.includes(idOf(item)) &&
      !selectedCache.value.has(idOf(item)),
  );
  if (missing.length === 0) {
    return;
  }
  const next = new Map(selectedCache.value);
  for (const item of missing) {
    next.set(idOf(item), item);
  }
  selectedCache.value = next;
}

/** Scarta le risposte stale: l'ultima richiesta partita è l'unica che vince. */
let requestId = 0;

async function fetchItems(append = false) {
  const rid = ++requestId;
  loading.value = true;
  error.value = null;
  try {
    const filters = {
      ...(search.value ? { search: search.value } : {}),
      ...(props.queryParams ?? {}),
    };

    if (props.paginated) {
      const res = await api.get<PaginatedResponse<Item>>(props.endpoint, {
        page: currentPage.value,
        per_page: PAGE_SIZE,
        ...filters,
      });
      if (rid !== requestId) {
        return;
      }
      const fetched = res.data ?? [];
      cacheSelected(fetched);
      items.value = append ? [...items.value, ...fetched] : fetched;
      hasMore.value = currentPage.value < (res.meta?.last_page ?? 1);
    } else {
      const res = await api.get<{ data: Item[] }>(props.endpoint, {
        paginate: 0,
        ...filters,
      });
      if (rid !== requestId) {
        return;
      }
      const fetched = res.data ?? [];
      cacheSelected(fetched);
      items.value = fetched;
      hasMore.value = false;
    }
  } catch (e) {
    if (rid !== requestId) {
      return;
    }
    error.value = getApiErrorMessage(e) ?? t("common.error");
    hasMore.value = false;
  } finally {
    if (rid === requestId) {
      loading.value = false;
    }
  }
}

function reset() {
  currentPage.value = 1;
  items.value = [];
  hasMore.value = false;
  return fetchItems();
}

function reload() {
  return reset();
}

/** Pagina successiva: incrementata solo a fetch concluso, così non se ne perdono. */
async function loadMore() {
  if (loading.value || !hasMore.value || error.value) {
    return;
  }
  currentPage.value += 1;
  await fetchItems(true);
}

// ── Selection ──────────────────────────────────────────────────────────────
function emitChange() {
  emit(
    "change",
    modelValue.value.map(
      (id) => selectedCache.value.get(id) ?? ({ [props.valueKey]: id } as Item),
    ),
  );
  emitFormChange();
}

function toggle(item: Item) {
  if (isDisabled.value) {
    return;
  }
  const id = idOf(item);
  const selected = modelValue.value.includes(id);

  if (!selected && isMaxReached.value) {
    return;
  }

  modelValue.value = selected
    ? modelValue.value.filter((value) => value !== id)
    : [...modelValue.value, id];

  if (!selected) {
    selectedCache.value = new Map(selectedCache.value).set(id, item);
  }

  emitChange();
}

function clearAll() {
  modelValue.value = [];
  emitChange();
}

/**
 * Seleziona ciò che è caricato adesso, cioè i risultati della ricerca corrente e
 * delle pagine già scaricate — non l'intera collezione remota, che con
 * l'infinite scroll non è mai tutta in memoria.
 */
function selectAllLoaded() {
  const missing = items.value.filter(
    (item) => !modelValue.value.includes(idOf(item)),
  );
  const room =
    props.max === undefined
      ? missing.length
      : props.max - modelValue.value.length;
  const toAdd = missing.slice(0, Math.max(room, 0));
  if (toAdd.length === 0) {
    return;
  }

  const cache = new Map(selectedCache.value);
  for (const item of toAdd) {
    cache.set(idOf(item), item);
  }
  selectedCache.value = cache;

  modelValue.value = [...modelValue.value, ...toAdd.map(idOf)];
  emitChange();
}

function toggleAll() {
  if (isDisabled.value) {
    return;
  }
  if (allLoadedSelected.value) {
    clearAll();
    return;
  }
  selectAllLoaded();
}

// ── Infinite scroll (root = il div scrollabile, non il viewport) ───────────
const scroller = useTemplateRef("scroller");
const sentinel = useTemplateRef("sentinel");
let observer: IntersectionObserver | null = null;

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting) {
        loadMore();
      }
    },
    { root: scroller.value, threshold: 0.1 },
  );

  if (sentinel.value) {
    observer.observe(sentinel.value);
  }

  if (props.initialItems?.length) {
    cacheSelected(props.initialItems);
  }

  fetchItems();
});

watch(sentinel, (el) => {
  observer?.disconnect();
  if (el) {
    observer?.observe(el);
  }
});

// ── Search debounce ────────────────────────────────────────────────────────
let searchTimer: ReturnType<typeof setTimeout>;
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(reset, 300);
});

// ── queryParams change → reset e re-fetch ─────────────────────────────────
watch(
  () => props.queryParams,
  () => {
    reset();
  },
  { deep: true },
);

// ── initialItems arriva in modifica dopo il GET del parent ─────────────────
watch(
  () => props.initialItems,
  (list) => {
    if (list?.length) {
      cacheSelected(list);
    }
  },
  { deep: true },
);

onBeforeUnmount(() => {
  clearTimeout(searchTimer);
  observer?.disconnect();
});
</script>
