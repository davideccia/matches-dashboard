<template>
  <UCard variant="outline" class="w-full flex flex-col ring-2 sm:ring-4">
    <!-- ── HEADER: context + status ─────────────────────────── -->
    <template #header>
      <div class="flex items-start justify-between gap-2 sm:gap-4">
        <!-- Left: tournament / weight / discipline -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5 font-medium text-highlighted truncate">
            <UIcon name="i-mdi-trophy" class="size-3.5 shrink-0 text-warning" />
            <span class="truncate">{{ match.tournament?.name ?? '—' }}</span>
          </div>

          <!-- Order -->
          <div class="mt-0.5 sm:mt-1 w-full flex justify-center">
            <UBadge icon="i-mdi-pound" size="md" color="neutral" variant="subtle">{{ match.sort }}</UBadge>
          </div>

          <!-- Scheduled time + weight / discipline / rounds -->
          <div class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted min-h-4">
            <span v-if="match.scheduled_time" class="flex items-center gap-1">
              <UIcon name="i-mdi-clock-outline" class="size-3.5" />
              <span>{{ match.scheduled_time ?? '—' }}</span>
            </span>
            <USeparator v-if="match.scheduled_time" orientation="vertical" class="h-3.5 w-2" />
            <template v-if="match.weight_category?.label || match.discipline?.label">
              <span>{{ match.weight_category?.label ?? '—' }}</span>
              <span class="opacity-40">·</span>
              <span>{{ match.discipline?.label ?? '—' }}</span>
              <span class="opacity-40">·</span>
              <span>{{ match.rounds }} × {{ match.minutes_per_round }}</span>
            </template>
            <span v-else class="opacity-40">—</span>
          </div>
        </div>

        <!-- Right: status badge -->
        <UBadge
          :color="statusColor[match.status]"
          :variant="statusVariant[match.status]"
          size="sm"
          class="shrink-0"
        >
          <span
            v-if="match.status === 'in_progress'"
            class="mr-1.5 size-1.5 rounded-full bg-current animate-pulse inline-block"
          />
          {{ matchStatusLabel(match.status) }}
        </UBadge>
      </div>
    </template>

    <!-- ── BODY: athletes VS layout ─────────────────────────── -->
    <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 gap-y-2 sm:gap-x-4 sm:gap-y-3">
      <!-- Red corner -->
      <div
        class="flex flex-col gap-0.5"
        :class="isRedWinner ? 'opacity-100' : hasWinner ? 'opacity-50' : ''"
      >
        <div class="flex items-center gap-1.5">
          <span class="size-2 sm:size-2.5 rounded-full bg-red-500 shrink-0" />
          <span class="font-semibold text-highlighted text-xs sm:text-sm leading-tight truncate">
            {{ match.red_corner?.full_name ?? '—' }}
          </span>
          <UIcon
            v-if="isRedWinner"
            name="i-mdi-trophy"
            class="size-3 sm:size-3.5 text-warning shrink-0"
          />
        </div>
        <span class="pl-3.5 text-[0.625rem] sm:text-xs text-muted truncate">{{ match.red_corner_team || '—' }}</span>
      </div>

      <!-- VS -->
      <div class="flex flex-col items-center">
        <span class="text-xs font-bold tracking-widest uppercase text-muted select-none">vs</span>
      </div>

      <!-- Blue corner -->
      <div
        class="flex flex-col gap-0.5 items-end"
        :class="isBlueWinner ? 'opacity-100' : hasWinner ? 'opacity-50' : ''"
      >
        <div class="flex items-center gap-1.5">
          <UIcon
            v-if="isBlueWinner"
            name="i-mdi-trophy"
            class="size-3 sm:size-3.5 text-warning shrink-0"
          />
          <span class="font-semibold text-highlighted text-xs sm:text-sm leading-tight truncate">
            {{ match.blue_corner?.full_name ?? '—' }}
          </span>
          <span class="size-2 sm:size-2.5 rounded-full bg-blue-500 shrink-0" />
        </div>
        <span class="pr-3.5 text-[0.625rem] sm:text-xs text-muted truncate">{{ match.blue_corner_team || '—' }}</span>
      </div>

      <!-- Result banner — always rendered, one of four states -->
      <!-- Winner -->
      <div
        v-if="hasWinner"
        class="col-span-3 flex items-center justify-center gap-1.5 rounded-lg bg-success/10 px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium text-success"
      >
        <UIcon name="i-mdi-medal-outline" class="size-3.5" />
        {{ match.winner?.full_name ?? t('match.winner') }}
      </div>

      <!-- Draw / no contest -->
      <div
        v-else-if="match.status === 'completed'"
        class="col-span-3 flex items-center justify-center gap-1.5 rounded-lg bg-muted/50 px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium text-muted"
      >
        <UIcon name="i-mdi-scale-balance" class="size-3.5" />
        {{ match.end_method ? endMethodLabel(match.end_method) : t('match.noWinner') }}
      </div>

      <!-- Cancelled -->
      <div
        v-else-if="match.status === 'cancelled'"
        class="col-span-3 flex items-center justify-center gap-1.5 rounded-lg bg-error/10 px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium text-error"
      >
        <UIcon name="i-mdi-cancel" class="size-3.5" />
        {{ t(`match.status.cancelled`) }}
      </div>

      <!-- Pending (SCHEDULED / IN_PROGRESS) -->
      <div
        v-else
        class="col-span-3 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-default px-2 py-1 sm:px-3 sm:py-1.5 text-xs text-muted"
      >
        <UIcon name="i-mdi-clock-outline" class="size-3.5" />
        {{ matchStatusLabel(match.status) }}
      </div>
    </div>

    <!-- ── FOOTER: end method + judge points — always rendered ── -->
    <template #footer>
      <div class="flex flex-wrap items-center gap-2 sm:gap-3">
        <template v-if="match.end_method || hasJudgePoints">
          <!-- End method -->
          <span
            v-if="match.end_method"
            class="flex items-center gap-1 text-xs text-muted"
          >
            <UIcon name="i-mdi-flag" class="size-3.5" />
            <span class="font-medium text-default">
              {{ endMethodLabel(match.end_method) }}
            </span>
          </span>

          <!-- Judge points button -->
          <UButton
            v-if="hasJudgePoints && showJudgesPoints"
            type="button"
            variant="outline"
            color="neutral"
            size="xs"
            icon="i-mdi-clipboard-list-outline"
            @click="judgesPointsOpen = true"
          >
            {{ t('match.judgesPointsTable') }}
          </UButton>
        </template>

        <!-- Empty state -->
        <span v-else class="text-xs text-muted opacity-40">—</span>
      </div>
    </template>
  </UCard>

  <!-- ── MODAL: judges points table (readonly) ─────────────────── -->
  <UModal v-if="showJudgesPoints" v-model:open="judgesPointsOpen" :title="t('match.judgesPointsTable')">
    <template #body>
      <MatchRecordJudgesPointsTable
        :model-value="judgesPointsRows"
        readonly
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { MatchRecord } from '~/types/models'
import type { MatchStatus } from '~/utils/constants'

const props = defineProps<{
  match: MatchRecord
  showJudgesPoints?: boolean
}>()

const showJudgesPoints = computed(() => props.showJudgesPoints ?? true)

const { t } = useI18n()

const judgesPointsOpen = ref(false)

function matchStatusLabel(status: string): string {
  if (status === 'scheduled') { return t('match.status.scheduled') }
  if (status === 'in_progress') { return t('match.status.in_progress') }
  if (status === 'completed') { return t('match.status.completed') }
  if (status === 'cancelled') { return t('match.status.cancelled') }
  return status
}

function endMethodLabel(method: string): string {
  if (method === 'victory_unanimous_decision') { return t('match.endMethod.victory_unanimous_decision') }
  if (method === 'victory_split_decision') { return t('match.endMethod.victory_split_decision') }
  if (method === 'victory_ko') { return t('match.endMethod.victory_ko') }
  if (method === 'victory_tko') { return t('match.endMethod.victory_tko') }
  if (method === 'victory_disqualification') { return t('match.endMethod.victory_disqualification') }
  if (method === 'draw') { return t('match.endMethod.draw') }
  if (method === 'no_contest') { return t('match.endMethod.no_contest') }
  return method
}

const statusColor: Record<MatchStatus, 'info' | 'warning' | 'success' | 'error'> = {
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
}

const statusVariant: Record<MatchStatus, 'outline' | 'solid' | 'subtle'> = {
  scheduled: 'outline',
  in_progress: 'solid',
  completed: 'solid',
  cancelled: 'subtle',
}

const hasWinner = computed(() => !!props.match.winner_id)

const hasJudgePoints = computed(() => {
  const points = props.match.judges_points
  if (!Array.isArray(points) || points.length === 0) { return false }
  return points.some(row =>
    row.judge1_red !== null || row.judge2_red !== null || row.judge3_red !== null
    || row.judge1_blue !== null || row.judge2_blue !== null || row.judge3_blue !== null,
  )
})

const isRedWinner = computed(
  () => hasWinner.value && props.match.winner_id === props.match.red_corner_id,
)
const isBlueWinner = computed(
  () => hasWinner.value && props.match.winner_id === props.match.blue_corner_id,
)

const judgesPointsRows = computed(() => props.match.judges_points ?? [])
</script>
