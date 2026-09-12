<template>
  <div class="flex-1 flex flex-col items-center px-4 py-4 sm:py-8">
    <div class="w-full space-y-4 sm:space-y-6">
      <!-- Sticky top area: header + tournament bar (state B) -->
      <div class="sticky top-0 z-10 bg-default -mx-4 px-4 pt-2 pb-3 space-y-2 sm:space-y-3">
        <!-- Header: full on mobile (state A) / hidden on mobile (state B) -->
        <div class="flex flex-col items-center gap-2 sm:gap-3" :class="{ 'hidden sm:flex': selectedTournament }">
          <div class="flex items-center gap-2">
            <LocaleSwitcher />
            <ColorModeToggle />
            <RealtimeToggle v-if="selectedTournament" v-model="realtimeEnabled" />
          </div>
          <div class="size-10 sm:size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <UIcon name="i-mdi-sword-cross" class="size-5 sm:size-6 text-primary" />
          </div>
          <div class="text-center space-y-0.5">
            <h1 class="text-xl sm:text-2xl font-bold text-default">
              {{ t('publicMatchRecords.title') }}
            </h1>
            <p class="text-sm text-muted">
              {{ t('nav.tournaments') }}
            </p>
          </div>
        </div>

        <!-- Mobile compact title row (state B only) -->
        <div v-if="selectedTournament" class="flex sm:hidden items-center justify-between py-1">
          <div class="flex items-center gap-1.5">
            <div class="size-7 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <UIcon name="i-mdi-sword-cross" class="size-4 text-primary" />
            </div>
            <span class="text-sm font-bold text-default">{{ t('publicMatchRecords.title') }}</span>
          </div>
          <div class="flex items-center gap-2">
            <LocaleSwitcher />
            <ColorModeToggle />
            <RealtimeToggle v-model="realtimeEnabled" />
          </div>
        </div>

        <!-- Tournament bar (state B only) -->
        <div v-if="selectedTournament" class="flex items-center justify-between gap-2 sm:gap-4 rounded-2xl bg-elevated border border-default px-3 sm:px-5 py-1.5 sm:py-2">
          <div class="flex items-center gap-2 sm:gap-3 min-w-0">
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              icon="i-mdi-arrow-left"
              :aria-label="t('publicMatchRecords.changeTournament')"
              :title="t('publicMatchRecords.changeTournament')"
              class="shrink-0"
              @click="clearTournament"
            />
            <UIcon name="i-mdi-trophy" class="size-4 text-warning shrink-0" />
            <div class="min-w-0 flex items-center gap-1.5 flex-wrap">
              <p class="font-semibold text-sm truncate min-w-0">
                {{ selectedTournament.name }}
              </p>
              <span class="text-xs text-muted shrink-0">
                {{ formatServerDateOnly(selectedTournament.date, locale) }} · {{ selectedTournament.location_city }}
              </span>
              <UBadge
                :color="selectedTournament.status === 'in_progress' ? 'warning' : 'success'"
                variant="subtle"
                size="sm"
                class="w-fit flex items-center gap-1 shrink-0"
              >
                <span v-if="selectedTournament.status === 'in_progress'" class="size-1.5 rounded-full bg-current animate-pulse inline-block" />
                {{ tournamentStatusLabel(selectedTournament.status) }}
              </UBadge>
            </div>
          </div>
        </div>

        <div v-if="selectedTournament" class="flex justify-center">
          <ViewModeToggle v-model="viewMode" />
        </div>
      </div>

      <!-- Back home -->
      <div v-if="!selectedTournament" class="space-y-3">
        <USeparator />
        <p class="text-sm text-muted text-center">
          {{ t('common.notWhatYouAreLookingFor') }}
        </p>
        <UButton
          :label="t('common.backHome')"
          icon="i-mdi-arrow-left"
          block
          variant="outline"
          color="neutral"
          @click="() => { navigateTo('/') }"
        />
      </div>

      <!-- ── STATE A: Tournament selector ────────────────────────────────── -->
      <div v-if="!selectedTournament" class="rounded-2xl bg-elevated border border-default p-5 space-y-3">
        <div class="space-y-0.5">
          <h2 class="text-base font-semibold flex items-center gap-2">
            <UIcon name="i-mdi-trophy" class="size-4 text-primary" />
            {{ t('publicMatchRecords.selectTournament') }}
          </h2>
        </div>

        <UInput
          v-model="tournamentsSearchInput"
          icon="i-mdi-magnify"
          :placeholder="t('publicMatchRecords.searchTournament')"
          size="md"
          class="w-full"
        />

        <!-- Loading skeletons (initial load) -->
        <div v-if="tournamentsLoading && tournaments.length === 0" class="flex flex-col gap-3">
          <div v-for="n in 3" :key="n" class="w-full rounded-xl border border-default p-5 space-y-2">
            <USkeleton class="h-4 w-3/4 rounded" />
            <USkeleton class="h-3 w-1/2 rounded" />
            <USkeleton class="h-3 w-2/3 rounded" />
          </div>
        </div>

        <!-- Tournament cards -->
        <div v-else-if="tournaments.length > 0" class="flex flex-col gap-3">
          <div
            v-for="tournament in tournaments"
            :key="tournament.id"
            class="w-full rounded-xl border p-5 cursor-pointer transition-all select-none border-default hover:border-muted hover:bg-elevated/50"
            @click="selectTournament(tournament)"
          >
            <p class="text-base font-semibold leading-snug">
              {{ tournament.name }}
            </p>
            <p class="text-sm text-muted mt-1">
              {{ formatServerDateOnly(tournament.date, locale) }}
            </p>
            <p class="text-sm text-muted">
              {{ tournament.location_city }}
            </p>
            <UBadge
              :color="tournament.status === 'in_progress' ? 'warning' : 'success'"
              variant="subtle"
              size="md"
              class="mt-2 w-fit flex items-center gap-1"
            >
              <span v-if="tournament.status === 'in_progress'" class="size-1.5 rounded-full bg-current animate-pulse inline-block" />
              {{ tournamentStatusLabel(tournament.status) }}
            </UBadge>
          </div>

          <!-- Loading skeletons (append) -->
          <template v-if="tournamentsLoading">
            <div v-for="n in 2" :key="n" class="w-full rounded-xl border border-default p-5 space-y-2">
              <USkeleton class="h-4 w-3/4 rounded" />
              <USkeleton class="h-3 w-1/2 rounded" />
              <USkeleton class="h-3 w-2/3 rounded" />
            </div>
          </template>

          <!-- Infinite scroll sentinel -->
          <div ref="tournamentSentinel" class="h-px" />
        </div>

        <!-- Empty state -->
        <div v-else-if="!tournamentsLoading" class="flex flex-col items-center gap-1.5 py-8 text-muted">
          <UIcon name="i-mdi-trophy" class="size-8 opacity-30" />
          <p class="text-sm font-medium">
            {{ t('publicMatchRecords.noTournaments') }}
          </p>
          <p class="text-xs">
            {{ t('publicMatchRecords.noTournamentsHint') }}
          </p>
        </div>
      </div>

      <!-- ── STATE B: MatchRecord grid or window view ────────────────────────── -->
      <template v-else>
        <TournamentsMatchRecordsGridView v-if="viewMode === 'grid'" :tournament-id="selectedTournament.id" :last-event="lastEvent" />
        <TournamentsMatchRecordsWindowView v-else :tournament-id="selectedTournament.id" :last-event="lastEvent" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MatchRecordChangedPayload } from '~/composables/useTournamentMatchRecords'
import type { Tournament } from '~/types/models'

definePageMeta({ layout: 'public', sanctum: { excluded: true } })

const { config: apiConfig } = useApiConfig()
const { t, locale } = useI18n()
const toast = useToast()

function tournamentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    scheduled: t('tournament.status.scheduled'),
    registrations_opened: t('tournament.status.registrations_opened'),
    registrations_closed: t('tournament.status.registrations_closed'),
    in_progress: t('tournament.status.in_progress'),
    completed: t('tournament.status.completed'),
    cancelled: t('tournament.status.cancelled'),
  }
  return map[status] ?? status
}

// ── Public API helper (no auth token) ───────────────────────────────────────
interface PageData<T> {
  data: T[]
  meta: { total: number, current_page: number, last_page: number, per_page: number }
}

function apiGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  return $fetch<T>(path, { baseURL: apiConfig.value.baseUrl, params })
}

// ── Tournament selection ─────────────────────────────────────────────────────
const tournamentsSearch = ref('')
const tournamentsSearchInput = ref('')
const selectedTournament = ref<Tournament | null>(null)

const tournaments = ref<Tournament[]>([])
const tournamentsLoading = ref(false)
const currentPage = ref(1)
const hasMore = ref(false)
const PAGE_SIZE = 10

async function fetchTournaments(append = false) {
  if (tournamentsLoading.value) { return }
  tournamentsLoading.value = true
  try {
    const res = await apiGet<PageData<Tournament>>('/api/public/tournaments', {
      paginate: 1,
      page: currentPage.value,
      per_page: PAGE_SIZE,
      ...(tournamentsSearch.value ? { search: tournamentsSearch.value } : {}),
    })
    const fetched = res.data ?? []
    tournaments.value = append ? [...tournaments.value, ...fetched] : fetched
    hasMore.value = currentPage.value < (res.meta?.last_page ?? 1)
  } catch (e) {
    if (isRateLimitedError(e)) {
      toast.add({ title: t('publicMatchRecords.rateLimited'), color: 'warning' })
    }
  } finally {
    tournamentsLoading.value = false
  }
}

let tournamentSearchTimer: ReturnType<typeof setTimeout>
watch(tournamentsSearchInput, (val) => {
  clearTimeout(tournamentSearchTimer)
  tournamentSearchTimer = setTimeout(() => {
    tournamentsSearch.value = val
  }, 300)
})

watch(tournamentsSearch, () => {
  currentPage.value = 1
  tournaments.value = []
  fetchTournaments()
})

watch(currentPage, (page) => {
  if (page > 1) { fetchTournaments(true) }
})

// ── Infinite scroll ───────────────────────────────────────────────────────────
const tournamentSentinel = useTemplateRef('tournamentSentinel')
let tournamentObserver: IntersectionObserver | null = null

onMounted(() => {
  tournamentObserver = new IntersectionObserver((entries) => {
    const entry = entries[0]
    if (entry?.isIntersecting && !tournamentsLoading.value && hasMore.value) {
      currentPage.value++
    }
  }, { threshold: 0.1 })
  fetchTournaments()
})

watch(tournamentSentinel, (el) => {
  tournamentObserver?.disconnect()
  if (el) { tournamentObserver?.observe(el) }
})

function selectTournament(tournament: Tournament) {
  selectedTournament.value = tournament
}

function clearTournament() {
  selectedTournament.value = null
}

// ── View mode (grid vs window) ───────────────────────────────────────────────
const VIEW_MODE_KEY = 'matches.public-match-records-view-mode'
type MatchRecordsViewMode = 'grid' | 'window'

function readStoredViewMode(): MatchRecordsViewMode {
  try {
    return localStorage.getItem(VIEW_MODE_KEY) === 'grid' ? 'grid' : 'window'
  } catch {
    return 'window'
  }
}

const viewMode = ref<MatchRecordsViewMode>(readStoredViewMode())

watch(viewMode, (mode) => {
  try {
    localStorage.setItem(VIEW_MODE_KEY, mode)
  } catch {
    // localStorage non disponibile (private browsing, ecc.): la preferenza non persiste, non blocca il toggle.
  }
})

// ── WebSocket (Laravel Echo / Reverb) ─────────────────────────────────────────
// Un'unica sottoscrizione per tutta la durata della selezione torneo: passarla come
// prop alle viste (invece che farle sottoscrivere ciascuna per conto proprio) evita
// il leave+rejoin dello stesso canale ad ogni switch griglia/finestra, che con Echo/
// Reverb può lasciare il client "silenzioso" (subscribe in race con l'unsubscribe).
const realtimeEnabled = ref(true)
const tournamentId = computed(() => (realtimeEnabled.value ? (selectedTournament.value?.id ?? null) : null))
const { lastEvent: wsLastEvent } = useTournamentMatchRecords(tournamentId)

// Segnale unico passato alle viste: eventi WS reali + una "spinta" sintetica quando
// il realtime viene riattivato, per recuperare eventuali aggiornamenti persi in pausa.
const lastEvent = ref<MatchRecordChangedPayload | null>(null)

watch(wsLastEvent, (event) => {
  lastEvent.value = event
})

watch(realtimeEnabled, (on) => {
  if (on) { lastEvent.value = { refresh: true } }
})

onUnmounted(() => {
  clearTimeout(tournamentSearchTimer)
  tournamentObserver?.disconnect()
})
</script>
