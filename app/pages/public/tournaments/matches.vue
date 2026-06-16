<template>
  <div class="min-h-screen bg-default flex flex-col items-center px-4 py-8">
    <div class="w-full max-w-5xl space-y-6">
      <!-- Header -->
      <div class="flex flex-col items-center gap-3 pt-2">
        <LocaleSwitcher />
        <div class="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <UIcon name="i-mdi-sword-cross" class="size-6 text-primary" />
        </div>
        <div class="text-center space-y-0.5">
          <h1 class="text-2xl font-bold text-default">
            {{ t('publicMatches.title') }}
          </h1>
          <p class="text-sm text-muted">
            {{ t('nav.tournaments') }}
          </p>
        </div>
      </div>

      <!-- ── STATE A: Tournament selector ────────────────────────────────── -->
      <div v-if="!selectedTournament" class="rounded-2xl bg-elevated border border-default p-5 space-y-3">
        <div class="space-y-0.5">
          <h2 class="text-base font-semibold flex items-center gap-2">
            <UIcon name="i-mdi-trophy" class="size-4 text-primary" />
            {{ t('publicMatches.selectTournament') }}
          </h2>
        </div>

        <UInput
          v-model="tournamentsSearchInput"
          icon="i-mdi-magnify"
          :placeholder="t('publicMatches.searchTournament')"
          size="md"
          class="w-full"
        />

        <!-- Loading skeletons -->
        <div v-if="tournamentsLoading" class="flex flex-col gap-3">
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
              {{ tournament.locationCity }}
            </p>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="flex flex-col items-center gap-1.5 py-8 text-muted">
          <UIcon name="i-mdi-trophy" class="size-8 opacity-30" />
          <p class="text-sm font-medium">
            {{ t('publicMatches.noTournaments') }}
          </p>
          <p class="text-xs">
            {{ t('publicMatches.noTournamentsHint') }}
          </p>
        </div>

        <!-- Pagination -->
        <div v-if="tournamentsTotalPages > 1" class="flex items-center justify-between gap-2">
          <UButton
            size="sm"
            variant="ghost"
            color="neutral"
            leading-icon="i-mdi-chevron-left"
            :disabled="tournamentsPage === 0"
            @click="tournamentsPage--"
          >
            {{ t('publicMatches.prev') }}
          </UButton>
          <span class="text-xs text-muted">
            {{ t('publicMatches.page', { current: tournamentsPage + 1, total: tournamentsTotalPages }) }}
          </span>
          <UButton
            size="sm"
            variant="ghost"
            color="neutral"
            trailing-icon="i-mdi-chevron-right"
            :disabled="tournamentsPage >= tournamentsTotalPages - 1"
            @click="tournamentsPage++"
          >
            {{ t('publicMatches.next') }}
          </UButton>
        </div>
      </div>

      <!-- ── STATE B: Match grid ──────────────────────────────────────────── -->
      <template v-else>
        <!-- Tournament header bar -->
        <div class="flex items-center justify-between gap-4 rounded-2xl bg-elevated border border-default px-5 py-4">
          <div class="flex items-center gap-3 min-w-0">
            <UIcon name="i-mdi-trophy" class="size-5 text-warning shrink-0" />
            <div class="min-w-0">
              <p class="font-semibold text-sm truncate">
                {{ selectedTournament.name }}
              </p>
              <p class="text-xs text-muted">
                {{ formatServerDateOnly(selectedTournament.date, locale) }} · {{ selectedTournament.locationCity }}
              </p>
            </div>
            <UBadge color="error" variant="solid" size="xs" class="shrink-0 flex items-center gap-1">
              <span class="size-1.5 rounded-full bg-current animate-pulse inline-block" />
              {{ t('publicMatches.liveIndicator') }}
            </UBadge>
          </div>
          <UButton
            size="sm"
            variant="ghost"
            color="neutral"
            leading-icon="i-mdi-arrow-left"
            @click="clearTournament"
          >
            {{ t('publicMatches.changeTournament') }}
          </UButton>
        </div>

        <!-- Loading skeletons -->
        <div v-if="matchesLoading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <USkeleton v-for="n in 6" :key="n" class="h-48 rounded-xl" />
        </div>

        <!-- Empty state -->
        <div v-else-if="matches.length === 0" class="flex flex-col items-center gap-2 py-16 text-muted">
          <UIcon name="i-mdi-sword-cross" class="size-10 opacity-40" />
          <span class="text-sm">{{ t('publicMatches.noMatches') }}</span>
        </div>

        <!-- Match cards -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div
            v-for="(match, index) in matches"
            :key="match.id"
            :ref="(el) => { if (el) matchCardEls[index] = el as HTMLElement }"
          >
            <MatchCardReadOnly :match="match" :show-judges-points="true" />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Match } from '~/types/models'
import { Client } from '@stomp/stompjs'

definePageMeta({ layout: false, sanctum: { excluded: true } })

const config = useRuntimeConfig()
const { t, locale } = useI18n()

const wsBase = config.public.apiBase.replace(/^http/, 'ws')

// ── Public API helper (no auth token) ───────────────────────────────────────
interface PageData<T> {
  data: T[]
  meta: { total: number, current_page: number, last_page: number, per_page: number }
}

function apiGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  return $fetch<T>(path, { baseURL: config.public.apiBase, params })
}

// ── Tournament selection ─────────────────────────────────────────────────────
const pageSize = 10

interface Tournament {
  id: string
  name: string
  date: string
  locationCity: string
}

const tournamentsPage = ref(0)
const tournamentsSearch = ref('')
const tournamentsSearchInput = ref('')
const selectedTournament = ref<Tournament | null>(null)

let tournamentSearchTimer: ReturnType<typeof setTimeout>
watch(tournamentsSearchInput, (val) => {
  clearTimeout(tournamentSearchTimer)
  tournamentSearchTimer = setTimeout(() => {
    tournamentsSearch.value = val
    tournamentsPage.value = 0
  }, 300)
})

const { data: tournamentsData, status: tournamentsStatus } = useLazyAsyncData(
  'public-tournaments',
  () => apiGet<PageData<Tournament>>('/api/desktop/public/tournaments', {
    page: tournamentsPage.value + 1,
    per_page: pageSize,
    ...(tournamentsSearch.value ? { search: tournamentsSearch.value } : {}),
  }),
  { watch: [tournamentsPage, tournamentsSearch], default: () => null },
)

const tournaments = computed(() => tournamentsData.value?.data ?? [])
const tournamentsTotal = computed(() => tournamentsData.value?.meta?.total ?? 0)
const tournamentsLoading = computed(() => tournamentsStatus.value === 'pending')
const tournamentsTotalPages = computed(() => Math.ceil(tournamentsTotal.value / pageSize))

function selectTournament(tournament: Tournament) {
  selectedTournament.value = tournament
}

function clearTournament() {
  selectedTournament.value = null
}

// ── Matches ──────────────────────────────────────────────────────────────────
const matchCardEls = ref<HTMLElement[]>([])

const { data: matchesData, status: matchesStatus, refresh: refreshMatches } = useLazyAsyncData(
  'public-matches',
  () => {
    if (!selectedTournament.value) { return Promise.resolve(null) }
    return apiGet<PageData<Match>>(
      `/api/desktop/public/tournaments/${selectedTournament.value.id}/matches`,
      { page: 1, per_page: 100 },
    )
  },
  { watch: [selectedTournament], default: () => null },
)

const matches = computed(() => matchesData.value?.data ?? [])
const matchesLoading = computed(() => matchesStatus.value === 'pending')

// Keep the active (or next) match centered on every refresh, including WS pushes.
watch(matchesData, async () => {
  await nextTick()
  const inProgressIdx = matches.value.findIndex(m => m.status === 'IN_PROGRESS')
  if (inProgressIdx !== -1 && matchCardEls.value[inProgressIdx]) {
    matchCardEls.value[inProgressIdx].scrollIntoView({ behavior: 'smooth', block: 'center' })
  } else {
    const scheduledIdx = matches.value.findIndex(m => m.status === 'SCHEDULED')
    if (scheduledIdx !== -1 && matchCardEls.value[scheduledIdx]) {
      matchCardEls.value[scheduledIdx].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
})

// ── WebSocket (STOMP) ────────────────────────────────────────────────────────
let stompClient: Client | null = null

function startClient(id: string) {
  stompClient = new Client({
    brokerURL: `${wsBase}/ws`,
    onConnect: () => {
      stompClient!.subscribe(`/topic/tournaments/${id}/matches`, () => refreshMatches())
    },
    reconnectDelay: 3000,
  })
  stompClient.activate()
}

function stopClient() {
  stompClient?.deactivate()
  stompClient = null
}

watch(selectedTournament, (tournament) => {
  stopClient()
  if (tournament) { startClient(tournament.id) }
})

onUnmounted(() => {
  stopClient()
  clearTimeout(tournamentSearchTimer)
})
</script>
