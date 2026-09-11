<template>
  <div>
    <!-- Loading skeletons -->
    <div v-if="matchesLoading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
      <USkeleton v-for="n in 6" :key="n" class="h-48 rounded-xl" />
    </div>

    <!-- Empty state -->
    <div v-else-if="matches.length === 0" class="flex flex-col items-center gap-2 py-16 text-muted">
      <UIcon name="i-mdi-sword-cross" class="size-10 opacity-40" />
      <span class="text-sm">{{ t('publicMatchRecords.noMatchRecords') }}</span>
    </div>

    <!-- MatchRecord cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
      <div
        v-for="(match, index) in matches"
        :key="match.id"
        :ref="(el) => { if (el) matchCardEls[index] = el as HTMLElement }"
      >
        <MatchRecordCardReadOnly :match="match" :show-judges-points="true" hide-notes />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MatchRecordChangedPayload } from '~/composables/useTournamentMatchRecords'
import type { MatchRecord } from '~/types/models'

const props = defineProps<{
  tournamentId: string
  lastEvent: MatchRecordChangedPayload | null
}>()

const { t } = useI18n()
const { config: apiConfig } = useApiConfig()
const toast = useToast()

interface PageData<T> {
  data: T[]
  meta: { total: number, current_page: number, last_page: number, per_page: number }
}

function apiGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  return $fetch<T>(path, { baseURL: apiConfig.value.baseUrl, params })
}

const matchCardEls = ref<HTMLElement[]>([])

const { data: matchesData, status: matchesStatus, error: matchesError, refresh: refreshMatchRecords } = useLazyAsyncData(
  `public-matches-${props.tournamentId}`,
  () => apiGet<PageData<MatchRecord>>(
    `/api/public/tournaments/${props.tournamentId}/match_records?with=tournament,red_corner,blue_corner,winner,weight_category,discipline`,
  ),
  // Niente cache tra i mount: al ritorno dalla vista finestra i match potrebbero essere cambiati.
  { default: () => null, getCachedData: () => undefined },
)

watch(matchesError, (e) => {
  if (e && isRateLimitedError(e)) {
    toast.add({ title: t('publicMatchRecords.rateLimited'), color: 'warning' })
  }
})

const matches = computed(() => matchesData.value?.data ?? [])
const matchesLoading = computed(() => matchesStatus.value === 'pending')

// Keep the active (or next) match centered on every refresh, including WS pushes.
watch(matchesData, async () => {
  await nextTick()
  const inProgressIdx = matches.value.findIndex(m => m.status === 'in_progress')
  if (inProgressIdx !== -1 && matchCardEls.value[inProgressIdx]) {
    matchCardEls.value[inProgressIdx].scrollIntoView({ behavior: 'smooth', block: 'center' })
  } else {
    const scheduledIdx = matches.value.findIndex(m => m.status === 'scheduled')
    if (scheduledIdx !== -1 && matchCardEls.value[scheduledIdx]) {
      matchCardEls.value[scheduledIdx].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
})

// ── WebSocket (Laravel Echo / Reverb) ────────────────────────────────────────
// La sottoscrizione vive nella pagina (una sola, non ricreata a ogni switch griglia/finestra):
// qui basta reagire ai nuovi eventi.
watch(() => props.lastEvent, (event) => {
  if (event?.refresh) { refreshMatchRecords() }
})
</script>
