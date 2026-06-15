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
            :key="item.tournamentId"
            class="rounded-xl border border-default bg-elevated p-4 flex flex-col gap-4 hover:border-accented transition-colors"
          >
            <!-- Card header -->
            <div class="flex items-start justify-between gap-2">
              <div class="flex flex-col gap-1.5 min-w-0">
                <NuxtLink
                  to="/admin/tournaments"
                  class="font-semibold text-default truncate hover:text-primary transition-colors leading-tight"
                >
                  {{ item.tournamentName }}
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
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'
import type { TournamentStatus } from '~/utils/constants'
import { formatServerDateOnly } from '~/utils/date'

definePageMeta({ layout: 'default' })

const { t, locale } = useI18n()
const { get } = useApi()

interface DashboardItem {
  tournamentId: string
  tournamentName: string
  status: TournamentStatus
  date: string
  totalRegistrations: number
  arrivedRegistrations: number
  absentRegistrations: number
  paidRegistrations: number
  unpaidRegistrations: number
  totalMatches: number
  scheduledMatches: number
  inProgressMatches: number
  completedMatches: number
  cancelledMatches: number
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
        resolve(await get<{ data: DashboardItem[] }>('/api/desktop/dashboard'))
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

const STATUS_COLORS: Record<TournamentStatus, BadgeProps['color']> = {
  SCHEDULED: 'neutral',
  REGISTRATIONS_OPENED: 'info',
  REGISTRATIONS_CLOSED: 'warning',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'error',
}

function statusBadgeColor(status: TournamentStatus): BadgeProps['color'] {
  return STATUS_COLORS[status] ?? 'neutral'
}

function tournamentStatusLabel(status: TournamentStatus): string {
  if (status === 'SCHEDULED') { return t('tournament.status.SCHEDULED') }
  if (status === 'REGISTRATIONS_OPENED') { return t('tournament.status.REGISTRATIONS_OPENED') }
  if (status === 'REGISTRATIONS_CLOSED') { return t('tournament.status.REGISTRATIONS_CLOSED') }
  if (status === 'IN_PROGRESS') { return t('tournament.status.IN_PROGRESS') }
  if (status === 'COMPLETED') { return t('tournament.status.COMPLETED') }
  if (status === 'CANCELLED') { return t('tournament.status.CANCELLED') }
  return status
}

function registrationMainStats(item: DashboardItem): StatEntry[] {
  return [
    { key: 'total', value: item.totalRegistrations, label: t('dashboard.total'), valueClass: 'text-default' },
  ]
}

function registrationLiveStats(item: DashboardItem): StatEntry[] {
  return [
    { key: 'arrived', value: item.arrivedRegistrations, label: t('dashboard.arrived'), valueClass: 'text-green-500' },
    { key: 'absent', value: item.absentRegistrations, label: t('dashboard.absent'), valueClass: item.absentRegistrations > 0 ? 'text-red-500' : 'text-default' },
    { key: 'paid', value: item.paidRegistrations, label: t('dashboard.paid'), valueClass: 'text-green-500' },
    { key: 'unpaid', value: item.unpaidRegistrations, label: t('dashboard.unpaid'), valueClass: item.unpaidRegistrations > 0 ? 'text-amber-500' : 'text-default' },
  ]
}

function matchStats(item: DashboardItem): StatEntry[] {
  return [
    { key: 'total', value: item.totalMatches, label: t('dashboard.total'), valueClass: 'text-default' },
    { key: 'scheduled', value: item.scheduledMatches, label: t('dashboard.scheduled'), valueClass: 'text-default' },
    { key: 'inProgress', value: item.inProgressMatches, label: t('dashboard.inProgress'), valueClass: item.inProgressMatches > 0 ? 'text-amber-500' : 'text-default', pulse: item.inProgressMatches > 0 },
    { key: 'completed', value: item.completedMatches, label: t('dashboard.completed'), valueClass: item.completedMatches > 0 ? 'text-green-500' : 'text-default' },
    { key: 'cancelled', value: item.cancelledMatches, label: t('dashboard.cancelled'), valueClass: item.cancelledMatches > 0 ? 'text-red-500' : 'text-default' },
  ]
}
</script>
