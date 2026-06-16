<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('nav.matchesBoard')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-mdi-plus" @click="openCreate">
            {{ t('common.add') }}
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col h-full overflow-hidden">
        <!-- Search / filter bar — always visible -->
        <div class="shrink-0 border-b border-muted px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <UInput
              v-model="searchInput"
              icon="i-mdi-magnify"
              :placeholder="t('common.search')"
              class="w-full sm:w-64"
            />
            <ApiSelectMenu
              v-model="tournamentId"
              endpoint="/api/admin/tournaments"
              label-key="name"
              :placeholder="t('match.selectTournament')"
              class="w-full sm:w-56"
            />
            <UButton
              v-if="tournamentId"
              icon="i-mdi-close"
              variant="ghost"
              color="neutral"
              :aria-label="t('common.cancel')"
              @click="tournamentId = null"
            />
            <UButton
              icon="i-mdi-refresh"
              variant="ghost"
              color="neutral"
              :loading="status === 'pending'"
              :aria-label="t('common.refresh')"
              @click="refreshBoard"
            />
          </div>
          <UBadge v-if="tournamentId && total > 0" variant="soft" color="neutral" size="md">
            {{ total }}
          </UBadge>
        </div>

        <!-- Scrollable content area -->
        <div class="flex-1 overflow-y-auto">
          <div class="flex flex-col gap-5 p-6">
            <!-- No tournament selected -->
            <div
              v-if="!tournamentId"
              class="flex flex-col items-center gap-3 py-20 text-muted"
            >
              <UIcon name="i-mdi-filter" class="size-10 opacity-40" />
              <span class="text-sm">{{ t('match.selectTournamentRequired') }}</span>
            </div>

            <!-- Loading skeletons -->
            <div
              v-else-if="status === 'pending'"
              class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              <USkeleton v-for="n in 10" :key="n" class="h-48 rounded-xl" />
            </div>

            <!-- Empty state -->
            <div
              v-else-if="items.length === 0"
              class="flex flex-col items-center gap-2 py-16 text-muted"
            >
              <UIcon name="i-mdi-sword-cross" class="size-10 opacity-40" />
              <span class="text-sm">{{ t('common.noResults') }}</span>
            </div>

            <!-- Card grid -->
            <div
              v-else
              class="bg-elevated rounded-xl p-2"
            >
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                <div
                  v-for="(match, index) in items"
                  :key="match.id"
                  :ref="(el) => { if (el) matchCardEls[index] = el as HTMLElement }"
                  class="cursor-pointer"
                  @click="openEdit(match)"
                >
                  <MatchCardReadOnly :match="match" :show-judges-points="false" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <ClientOnly>
    <MatchFormPanel v-model="panelOpen" :item="editingItem" :initial-tab="initialTab" @saved="refreshBoard" />
  </ClientOnly>
</template>

<script setup lang="ts">
import type { Match } from '~/types/models'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const api = useApi()

const searchInput = ref('')
const search = ref('')
const tournamentId = ref<string | null>(null)
const panelOpen = ref(false)
const editingItem = ref<Match | null>(null)
const initialTab = ref<'details' | 'outcome'>('details')
const matchCardEls = ref<HTMLElement[]>([])
let hasScrolledInitially = false

let searchTimer: ReturnType<typeof setTimeout>
watch(searchInput, (val) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    search.value = val
  }, 300)
})

interface MatchesResponse {
  data: Match[]
  meta: { total: number, current_page: number, last_page: number, per_page: number }
}

watch(tournamentId, (val) => {
  if (!val) {
    searchInput.value = ''
    search.value = ''
  }
  hasScrolledInitially = false
  matchCardEls.value = []
})

const { data, refresh, status } = useLazyAsyncData(
  'matches-board',
  () => {
    if (!tournamentId.value) { return Promise.resolve(null) }
    return api.get<MatchesResponse>('/api/admin/matches', {
      page: 1,
      ...(search.value ? { search: search.value } : {}),
      tournamentId: tournamentId.value,
    })
  },
  { watch: [search, tournamentId] },
)

const items = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.meta?.total ?? 0)

watch(items, async (newItems) => {
  if (!newItems.length || hasScrolledInitially) { return }
  await nextTick()
  const inProgressIdx = newItems.findIndex(m => m.status === 'IN_PROGRESS')
  if (inProgressIdx !== -1 && matchCardEls.value[inProgressIdx]) {
    matchCardEls.value[inProgressIdx].scrollIntoView({ behavior: 'smooth', block: 'center' })
  } else {
    const scheduledIdx = newItems.findIndex(m => m.status === 'SCHEDULED')
    if (scheduledIdx !== -1 && matchCardEls.value[scheduledIdx]) {
      matchCardEls.value[scheduledIdx].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
  hasScrolledInitially = true
})

function refreshBoard() {
  hasScrolledInitially = false
  matchCardEls.value = []
  refresh()
}

function openCreate() {
  editingItem.value = null
  initialTab.value = 'details'
  panelOpen.value = true
}

function openEdit(item: Match) {
  editingItem.value = item
  initialTab.value = 'outcome'
  panelOpen.value = true
}
</script>
