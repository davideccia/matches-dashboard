<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('nav.dashboard')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            :loading="pending"
            @click="refresh()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <!-- Loading skeleton -->
        <div v-if="pending" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="i in 3"
            :key="i"
            class="animate-pulse rounded-xl border border-default bg-elevated p-4 flex flex-col gap-4"
          >
            <!-- header -->
            <div class="flex items-start justify-between gap-2">
              <div class="space-y-2 flex-1">
                <div class="h-4 bg-accented rounded w-3/4" />
                <div class="h-5 bg-accented rounded w-1/3" />
              </div>
              <div class="h-4 bg-accented rounded w-16" />
            </div>
            <!-- registrations -->
            <div class="flex flex-col gap-3">
              <div class="h-3 bg-accented rounded w-1/4" />
              <div class="h-9 bg-accented rounded-lg" />
              <div class="flex flex-col gap-2">
                <div class="h-3 bg-accented rounded w-1/3" />
                <div class="grid grid-cols-4 gap-2">
                  <div v-for="j in 4" :key="j" class="space-y-1">
                    <div class="h-9 bg-accented rounded-lg" />
                    <div class="h-3 bg-accented rounded" />
                  </div>
                </div>
              </div>
            </div>
            <div class="h-px bg-border" />
            <!-- matches -->
            <div class="flex flex-col gap-2">
              <div class="h-3 bg-accented rounded w-1/4" />
              <div class="grid grid-cols-3 gap-2">
                <div v-for="j in 5" :key="j" class="space-y-1">
                  <div class="h-9 bg-accented rounded-lg" />
                  <div class="h-3 bg-accented rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="items.length === 0"
          class="flex flex-col items-center justify-center gap-3 py-20 text-muted"
        >
          <UIcon name="i-lucide-trophy" class="size-12 opacity-40" />
          <p class="text-sm">
            {{ t('dashboard.noTournaments') }}
          </p>
        </div>

        <!-- Tournament cards -->
        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="item in items"
            :key="item.tournament_id"
            class="rounded-xl border border-default bg-elevated p-4 flex flex-col gap-4 hover:border-accented transition-colors"
          >
            <!-- Card header -->
            <div class="flex items-start justify-between gap-2">
              <div class="flex flex-col gap-1.5 min-w-0">
                <NuxtLink
                  to="/admin/tournaments"
                  class="font-semibold text-default truncate hover:text-primary transition-colors leading-tight"
                >
                  {{ item.tournament_name }}
                </NuxtLink>
                <UBadge
                  :color="statusBadgeColor(item.status)"
                  variant="subtle"
                  size="sm"
                  class="self-start"
                >
                  {{ tournamentStatusLabel(item.status) }}
                </UBadge>
              </div>
              <span class="text-xs text-muted shrink-0 mt-0.5">
                {{ formatServerDateOnly(item.date, locale) }}
              </span>
            </div>

            <!-- Registrations section -->
            <div class="flex flex-col gap-3">
              <p class="text-xs font-medium uppercase tracking-wide text-muted">
                {{ t('dashboard.registrations') }}
              </p>
              <div class="grid grid-cols-1 gap-2">
                <div v-for="stat in registrationMainStats(item)" :key="stat.key" class="flex flex-col items-center gap-1">
                  <div class="rounded-lg bg-accented w-full py-1.5 flex items-center justify-center">
                    <span class="text-xl font-bold tabular-nums" :class="stat.valueClass">{{ stat.value }}</span>
                  </div>
                  <div class="text-xs text-muted leading-tight">
                    {{ stat.label }}
                  </div>
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <p class="text-xs font-medium uppercase tracking-wide text-muted">
                  {{ t('dashboard.liveManagement') }}
                </p>
                <div class="grid grid-cols-4 gap-2">
                  <div v-for="stat in registrationLiveStats(item)" :key="stat.key" class="flex flex-col items-center gap-1">
                    <div class="rounded-lg bg-accented w-full py-1.5 flex items-center justify-center">
                      <span class="text-xl font-bold tabular-nums" :class="stat.valueClass">{{ stat.value }}</span>
                    </div>
                    <div class="text-xs text-muted leading-tight text-center">
                      {{ stat.label }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="h-px bg-border" />

            <!-- Matches section -->
            <div class="flex flex-col gap-2">
              <p class="text-xs font-medium uppercase tracking-wide text-muted">
                {{ t('dashboard.matches') }}
              </p>
              <div class="grid grid-cols-3 gap-2">
                <div v-for="stat in matchStats(item)" :key="stat.key" class="flex flex-col items-center gap-1">
                  <div class="rounded-lg bg-accented w-full py-1.5 flex items-center justify-center" :class="stat.pulse ? 'animate-pulse' : ''">
                    <span class="text-xl font-bold tabular-nums" :class="stat.valueClass">{{ stat.value }}</span>
                  </div>
                  <div class="text-xs text-muted leading-tight">
                    {{ stat.label }}
                  </div>
                </div>
              </div>
            </div>

            <div class="h-px bg-border" />

            <!-- Actions -->
            <UButton
              icon="i-mdi-cog-play"
              color="primary"
              variant="soft"
              size="sm"
              class="self-start"
              :loading="generatingId === item.tournament_id"
              @click="openGenerateConfirm(item.tournament_id)"
            >
              {{ t('match.generate') }}
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <ClientOnly>
    <UModal v-model:open="confirmGenerateOpen" :title="t('common.confirm')">
      <template #body>
        <p class="text-sm text-muted">
          {{ t('match.generateConfirm') }}
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="cancelGenerate">
            {{ t('common.cancel') }}
          </UButton>
          <UButton color="primary" :loading="!!generatingId" @click="generateMatches">
            {{ t('common.confirm') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'
import type { TournamentStatus } from '~/utils/constants'
import { formatServerDateOnly } from '~/utils/date'

definePageMeta({ layout: 'default' })

const { t, locale } = useI18n()
const api = useApi()
const { get } = api
const toast = useToast()

const confirmGenerateOpen = ref(false)
const generatingId = ref<string | null>(null)

interface DashboardItem {
  tournament_id: string
  tournament_name: string
  status: TournamentStatus
  date: string
  total_registrations: number
  arrived_registrations: number
  absent_registrations: number
  paid_registrations: number
  unpaid_registrations: number
  total_matches: number
  scheduled_matches: number
  in_progress_matches: number
  completed_matches: number
  cancelled_matches: number
}

interface StatEntry {
  key: string
  value: number
  label: string
  valueClass: string
  pulse?: boolean
}

let controller: AbortController | null = null

const { data, pending, refresh } = useLazyAsyncData('dashboard', () => {
  controller?.abort()
  controller = new AbortController()
  const { signal } = controller

  return new Promise<{ data: DashboardItem[] } | null>((resolve, reject) => {
    const id = setTimeout(async () => {
      if (signal.aborted) {
        resolve(null)
        return
      }
      try {
        resolve(await get<{ data: DashboardItem[] }>('/api/admin/dashboard'))
      } catch (e) {
        reject(e)
      }
    }, 3000)
    signal.addEventListener('abort', () => {
      clearTimeout(id)
      resolve(null)
    })
  })
})

onUnmounted(() => controller?.abort())

const items = computed(() => data.value?.data ?? [])

function openGenerateConfirm(id: string) {
  generatingId.value = id
  confirmGenerateOpen.value = true
}

function cancelGenerate() {
  confirmGenerateOpen.value = false
  generatingId.value = null
}

async function generateMatches() {
  if (!generatingId.value) { return }
  const id = generatingId.value
  try {
    await api.post(`/api/admin/tournaments/${id}/match_records/generate`)
    confirmGenerateOpen.value = false
    toast.add({ title: t('match.generated'), color: 'success' })
    refresh()
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    generatingId.value = null
  }
}

const STATUS_COLORS: Record<TournamentStatus, BadgeProps['color']> = {
  scheduled: 'neutral',
  registrations_opened: 'info',
  registrations_closed: 'warning',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'error',
}

function statusBadgeColor(status: TournamentStatus): BadgeProps['color'] {
  return STATUS_COLORS[status] ?? 'neutral'
}

function tournamentStatusLabel(status: TournamentStatus): string {
  if (status === 'scheduled') { return t('tournament.status.scheduled') }
  if (status === 'registrations_opened') { return t('tournament.status.registrations_opened') }
  if (status === 'registrations_closed') { return t('tournament.status.registrations_closed') }
  if (status === 'in_progress') { return t('tournament.status.in_progress') }
  if (status === 'completed') { return t('tournament.status.completed') }
  if (status === 'cancelled') { return t('tournament.status.cancelled') }
  return status
}

function registrationMainStats(item: DashboardItem): StatEntry[] {
  return [
    { key: 'total', value: item.total_registrations, label: t('dashboard.total'), valueClass: 'text-default' },
  ]
}

function registrationLiveStats(item: DashboardItem): StatEntry[] {
  return [
    { key: 'arrived', value: item.arrived_registrations, label: t('dashboard.arrived'), valueClass: 'text-green-500' },
    { key: 'absent', value: item.absent_registrations, label: t('dashboard.absent'), valueClass: item.absent_registrations > 0 ? 'text-red-500' : 'text-default' },
    { key: 'paid', value: item.paid_registrations, label: t('dashboard.paid'), valueClass: 'text-green-500' },
    { key: 'unpaid', value: item.unpaid_registrations, label: t('dashboard.unpaid'), valueClass: item.unpaid_registrations > 0 ? 'text-amber-500' : 'text-default' },
  ]
}

function matchStats(item: DashboardItem): StatEntry[] {
  return [
    { key: 'total', value: item.total_matches, label: t('dashboard.total'), valueClass: 'text-default' },
    { key: 'scheduled', value: item.scheduled_matches, label: t('dashboard.scheduled'), valueClass: 'text-default' },
    { key: 'inProgress', value: item.in_progress_matches, label: t('dashboard.inProgress'), valueClass: item.in_progress_matches > 0 ? 'text-amber-500' : 'text-default', pulse: item.in_progress_matches > 0 },
    { key: 'completed', value: item.completed_matches, label: t('dashboard.completed'), valueClass: item.completed_matches > 0 ? 'text-green-500' : 'text-default' },
    { key: 'cancelled', value: item.cancelled_matches, label: t('dashboard.cancelled'), valueClass: item.cancelled_matches > 0 ? 'text-red-500' : 'text-default' },
  ]
}
</script>
