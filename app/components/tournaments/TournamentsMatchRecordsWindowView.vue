<template>
  <div>
    <!-- Loading skeletons -->
    <div v-if="loading && !current && !previous && !next" class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
      <USkeleton class="h-32 rounded-xl" />
      <USkeleton class="h-56 rounded-2xl md:scale-105" />
      <USkeleton class="h-32 rounded-xl" />
    </div>

    <!-- Window: previous / current / next -->
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
      <!-- Previous -->
      <div>
        <Transition name="window-slot" mode="out-in">
          <div v-if="previous" :key="previous.id">
            <MatchRecordCardReadOnly :match="previous" compact :label="t('publicMatchRecords.window.previous')" />
          </div>
          <TournamentsMatchRecordsWindowSlotEmpty v-else key="previous-empty" :label="t('publicMatchRecords.window.previous')" :hint="t('publicMatchRecords.window.noPrevious')" />
        </Transition>
      </div>

      <!-- Current -->
      <div class="md:scale-105 md:z-10">
        <Transition name="window-slot" mode="out-in">
          <div
            v-if="current"
            :key="current.id"
            class="rounded-2xl"
            :class="current.status === 'in_progress' ? 'ring-2 ring-amber-500/60 dark:ring-amber-500/50' : ''"
          >
            <MatchRecordCardReadOnly :match="current" :show-judges-points="true" hide-notes />
          </div>
          <TournamentsMatchRecordsWindowSlotEmpty
            v-else
            key="current-empty"
            :label="t('publicMatchRecords.window.current')"
            :hint="t('publicMatchRecords.window.noCurrent')"
            class="min-h-48"
          />
        </Transition>
      </div>

      <!-- Next -->
      <div>
        <Transition name="window-slot" mode="out-in">
          <div v-if="next" :key="next.id">
            <MatchRecordCardReadOnly :match="next" compact :label="t('publicMatchRecords.window.next')" />
          </div>
          <TournamentsMatchRecordsWindowSlotEmpty v-else key="next-empty" :label="t('publicMatchRecords.window.next')" :hint="t('publicMatchRecords.window.noNext')" />
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.window-slot-enter-active,
.window-slot-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.window-slot-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.window-slot-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>

<script setup lang="ts">
import type { MatchRecordChangedPayload } from '~/composables/useTournamentMatchRecords'
import type { MatchRecord } from '~/types/models'

interface MatchRecordsWindow {
  previous: MatchRecord | null
  current: MatchRecord | null
  next: MatchRecord | null
}

const props = defineProps<{
  tournamentId: string
  lastEvent: MatchRecordChangedPayload | null
}>()

const { t } = useI18n()
const { config: apiConfig } = useApiConfig()
const toast = useToast()

function apiGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  return $fetch<T>(path, { baseURL: apiConfig.value.baseUrl, params })
}

const { data: windowData, status: windowStatus, error: windowError, refresh: refreshWindow } = useLazyAsyncData(
  `public-matches-current-${props.tournamentId}`,
  () => apiGet<MatchRecordsWindow>(
    `/api/public/tournaments/${props.tournamentId}/match_records/current`,
    { with: 'tournament,red_corner,blue_corner,winner,weight_category,discipline' },
  ),
  // Niente cache tra i mount: al ritorno dalla vista griglia i match potrebbero essere cambiati.
  { default: () => null, getCachedData: () => undefined },
)

watch(windowError, (e) => {
  if (e && isRateLimitedError(e)) {
    toast.add({ title: t('publicMatchRecords.rateLimited'), color: 'warning' })
  }
})

const previous = computed(() => windowData.value?.previous ?? null)
const current = computed(() => windowData.value?.current ?? null)
const next = computed(() => windowData.value?.next ?? null)
const loading = computed(() => windowStatus.value === 'pending')

// ── WebSocket (Laravel Echo / Reverb) ────────────────────────────────────────
// La sottoscrizione vive nella pagina (una sola, non ricreata a ogni switch griglia/finestra):
// qui basta reagire ai nuovi eventi.
watch(() => props.lastEvent, (event) => {
  if (event?.refresh) { refreshWindow() }
})
</script>
