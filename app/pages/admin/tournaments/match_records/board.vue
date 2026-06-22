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
        <div class="shrink-0 p-6 pb-0">
          <OrphanRegistrationsAlert :items="matchmakingIssues" :skeleton="!tournamentId || orphanLoading" />
          <USeparator class="mt-6" />
        </div>
        <!-- Search / filter bar — always visible -->
        <div class="shrink-0 border-b border-muted px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <UButton
              icon="i-mdi-refresh"
              variant="ghost"
              color="neutral"
              :loading="status === 'pending'"
              :aria-label="t('common.refresh')"
              @click="refreshBoard"
            />
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
            <div class="h-6 w-px bg-accented" />
            <UButton
              icon="i-mdi-cog-play"
              color="primary"
              variant="soft"
              :loading="generating"
              :disabled="!tournamentId"
              @click="confirmGenerateOpen = true"
            >
              {{ t('match.generate') }}
            </UButton>
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
                  class="relative group"
                >
                  <MatchRecordCardReadOnly :match="match" :show-judges-points="false" />
                  <div class="absolute inset-0 rounded-[inherit] flex items-center justify-center gap-3 bg-default/75 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto">
                    <UButton
                      icon="i-mdi-pencil"
                      color="primary"
                      variant="solid"
                      size="sm"
                      @click.stop="openEdit(match)"
                    >
                      {{ t('common.edit') }}
                    </UButton>
                    <UButton
                      icon="i-mdi-delete"
                      color="error"
                      variant="solid"
                      size="sm"
                      @click.stop="confirmDelete(match)"
                    >
                      {{ t('common.delete') }}
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <ClientOnly>
    <MatchRecordFormPanel v-model="panelOpen" :item="editingItem" :initial-tab="initialTab" @saved="refreshBoard" />

    <UModal v-model:open="confirmDeleteOpen" :title="t('common.confirm')">
      <template #body>
        <p class="text-sm text-muted">
          {{ t('match.deleteConfirm') }}
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="confirmDeleteOpen = false">
            {{ t('common.cancel') }}
          </UButton>
          <UButton color="error" :loading="deleting" @click="deleteMatch">
            {{ t('common.delete') }}
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="confirmGenerateOpen" :title="t('common.confirm')">
      <template #body>
        <p class="text-sm text-muted">
          {{ t('match.generateConfirm') }}
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="confirmGenerateOpen = false">
            {{ t('common.cancel') }}
          </UButton>
          <UButton color="primary" :loading="generating" @click="generateMatches">
            {{ t('common.confirm') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { MatchmakingIssue, MatchRecord } from '~/types/models'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const api = useApi()
const toast = useToast()

const searchInput = ref('')
const search = ref('')
const tournamentId = ref<string | null>(null)
const matchmakingIssues = ref<MatchmakingIssue[]>([])
const orphanLoading = ref(false)
const panelOpen = ref(false)
const editingItem = ref<MatchRecord | null>(null)
const initialTab = ref<'details' | 'outcome'>('details')
const confirmGenerateOpen = ref(false)
const generating = ref(false)
const confirmDeleteOpen = ref(false)
const deleteTarget = ref<MatchRecord | null>(null)
const deleting = ref(false)
const matchCardEls = ref<HTMLElement[]>([])
let hasScrolledInitially = false

let searchTimer: ReturnType<typeof setTimeout>
watch(searchInput, (val) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    search.value = val
  }, 300)
})

interface MatchRecordesResponse {
  data: MatchRecord[]
  meta: { total: number, current_page: number, last_page: number, per_page: number }
}

async function refreshMatchmakingIssues() {
  if (!tournamentId.value) { return }
  orphanLoading.value = true
  try {
    const tournament = await api.get<{ data: { matchmaking_issues: MatchmakingIssue[] | null } }>(`/api/admin/tournaments/${tournamentId.value}`)
    matchmakingIssues.value = tournament.data.matchmaking_issues ?? []
  } finally {
    orphanLoading.value = false
  }
}

watch(tournamentId, (val) => {
  if (!val) {
    searchInput.value = ''
    search.value = ''
    matchmakingIssues.value = []
  }
  hasScrolledInitially = false
  matchCardEls.value = []
  if (!val) { return }
  refreshMatchmakingIssues()
})

const { data, refresh, status } = useLazyAsyncData(
  'matches-board',
  () => {
    if (!tournamentId.value) { return Promise.resolve(null) }
    return api.get<MatchRecordesResponse>('/api/admin/match_records?with=tournament,red_corner,blue_corner,winner,weight_category,discipline', {
      page: 1,
      ...(search.value ? { search: search.value } : {}),
      tournament_id: tournamentId.value,
    })
  },
  { watch: [search, tournamentId] },
)

const items = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.meta?.total ?? 0)

watch(items, async (newItems) => {
  if (!newItems.length || hasScrolledInitially) { return }
  await nextTick()
  const inProgressIdx = newItems.findIndex(m => m.status === 'in_progress')
  if (inProgressIdx !== -1 && matchCardEls.value[inProgressIdx]) {
    matchCardEls.value[inProgressIdx].scrollIntoView({ behavior: 'smooth', block: 'center' })
  } else {
    const scheduledIdx = newItems.findIndex(m => m.status === 'scheduled')
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
  refreshMatchmakingIssues()
}

async function generateMatches() {
  if (!tournamentId.value) { return }
  generating.value = true
  try {
    await api.post(`/api/admin/tournaments/${tournamentId.value}/match_records/generate`)
    confirmGenerateOpen.value = false
    toast.add({ title: t('match.generated'), color: 'success' })
    refreshBoard()
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e), color: 'error' })
  } finally {
    generating.value = false
  }
}

function confirmDelete(item: MatchRecord) {
  deleteTarget.value = item
  confirmDeleteOpen.value = true
}

async function deleteMatch() {
  if (!deleteTarget.value) { return }
  deleting.value = true
  try {
    await api.del(`/api/admin/match_records/${deleteTarget.value.id}`)
    confirmDeleteOpen.value = false
    deleteTarget.value = null
    toast.add({ title: t('match.deleted'), color: 'success' })
    refreshBoard()
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e), color: 'error' })
  } finally {
    deleting.value = false
  }
}

function openCreate() {
  editingItem.value = null
  initialTab.value = 'details'
  panelOpen.value = true
}

function openEdit(item: MatchRecord) {
  editingItem.value = item
  initialTab.value = 'outcome'
  panelOpen.value = true
}
</script>
