<template>
  <UCard variant="outline" class="w-full flex flex-col ring-2 sm:ring-4">
    <!-- ── HEADER: context + status ─────────────────────────── -->
    <template #header>
      <div class="flex items-start justify-between gap-2 sm:gap-4">
        <!-- Left: tournament / weight / discipline -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5 font-medium text-highlighted truncate">
            <UIcon name="i-mdi-trophy" class="size-3.5 shrink-0 text-warning" />
            <span class="truncate">{{ match.tournamentName ?? '—' }}</span>
          </div>
          <!-- Always rendered — dash when both missing -->
          <div class="mt-0.5 sm:mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted min-h-4">
            <template v-if="match.weightCategoryLabel || match.disciplineLabel">
              <span>{{ match.weightCategoryLabel ?? '—' }}</span>
              <span class="opacity-40">·</span>
              <span>{{ match.disciplineLabel ?? '—' }}</span>
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
            v-if="match.status === 'IN_PROGRESS'"
            class="mr-1.5 size-1.5 rounded-full bg-current animate-pulse inline-block"
          />
          {{ matchStatusLabel(match.status) }}
        </UBadge>
      </div>

      <!-- Scheduled time + order — always rendered -->
      <div class="mt-1.5 sm:mt-2.5 flex items-center gap-3 sm:gap-4 text-xs text-muted">
        <span class="flex items-center gap-1">
          <UIcon name="i-mdi-clock-outline" class="size-3.5" />
          <span>{{ match.scheduledTime ?? '—' }}</span>
        </span>
        <span class="flex items-center gap-1">
          <UIcon name="i-mdi-pound" class="size-3.5" />
          {{ match.sort }}
        </span>
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
            {{ match.redCornerFullName ?? '—' }}
          </span>
          <UIcon
            v-if="isRedWinner"
            name="i-mdi-trophy"
            class="size-3 sm:size-3.5 text-warning shrink-0"
          />
        </div>
        <span class="pl-3.5 text-[0.625rem] sm:text-xs text-muted truncate">{{ match.redCornerTeam || '—' }}</span>
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
            {{ match.blueCornerFullName ?? '—' }}
          </span>
          <span class="size-2 sm:size-2.5 rounded-full bg-blue-500 shrink-0" />
        </div>
        <span class="pr-3.5 text-[0.625rem] sm:text-xs text-muted truncate">{{ match.blueCornerTeam || '—' }}</span>
      </div>

      <!-- Result banner — always rendered, one of four states -->
      <!-- Winner -->
      <div
        v-if="hasWinner"
        class="col-span-3 flex items-center justify-center gap-1.5 rounded-lg bg-success/10 px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium text-success"
      >
        <UIcon name="i-mdi-medal-outline" class="size-3.5" />
        {{ match.winnerFullName ?? t('match.winner') }}
      </div>

      <!-- Draw / no contest -->
      <div
        v-else-if="match.status === 'COMPLETED'"
        class="col-span-3 flex items-center justify-center gap-1.5 rounded-lg bg-muted/50 px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium text-muted"
      >
        <UIcon name="i-mdi-scale-balance" class="size-3.5" />
        {{ match.endMethod ? endMethodLabel(match.endMethod) : t('match.noWinner') }}
      </div>

      <!-- Cancelled -->
      <div
        v-else-if="match.status === 'CANCELLED'"
        class="col-span-3 flex items-center justify-center gap-1.5 rounded-lg bg-error/10 px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium text-error"
      >
        <UIcon name="i-mdi-cancel" class="size-3.5" />
        {{ t(`match.status.CANCELLED`) }}
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
        <template v-if="match.endMethod || hasJudgePoints">
          <!-- End method -->
          <span
            v-if="match.endMethod"
            class="flex items-center gap-1 text-xs text-muted"
          >
            <UIcon name="i-mdi-flag" class="size-3.5" />
            <span class="font-medium text-default">
              {{ endMethodLabel(match.endMethod) }}
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
      <MatchJudgesPointsTable
        :model-value="match.judgesPoints ?? []"
        readonly
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Match } from '~/types/models'
import type { MatchStatus } from '~/utils/constants'

const props = defineProps<{
  match: Match
  showJudgesPoints?: boolean
}>()

const showJudgesPoints = computed(() => props.showJudgesPoints ?? true)

const { t } = useI18n()

const judgesPointsOpen = ref(false)

function matchStatusLabel(status: string): string {
  if (status === 'SCHEDULED') { return t('match.status.SCHEDULED') }
  if (status === 'IN_PROGRESS') { return t('match.status.IN_PROGRESS') }
  if (status === 'COMPLETED') { return t('match.status.COMPLETED') }
  if (status === 'CANCELLED') { return t('match.status.CANCELLED') }
  return status
}

function endMethodLabel(method: string): string {
  if (method === 'VICTORY_UNANIMOUS_DECISION') { return t('match.endMethod.VICTORY_UNANIMOUS_DECISION') }
  if (method === 'VICTORY_SPLIT_DECISION') { return t('match.endMethod.VICTORY_SPLIT_DECISION') }
  if (method === 'VICTORY_KO') { return t('match.endMethod.VICTORY_KO') }
  if (method === 'VICTORY_TKO') { return t('match.endMethod.VICTORY_TKO') }
  if (method === 'VICTORY_DISQUALIFICATION') { return t('match.endMethod.VICTORY_DISQUALIFICATION') }
  if (method === 'DRAW') { return t('match.endMethod.DRAW') }
  if (method === 'NO_CONTEST') { return t('match.endMethod.NO_CONTEST') }
  return method
}

const statusColor: Record<MatchStatus, 'info' | 'warning' | 'success' | 'error'> = {
  SCHEDULED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'error',
}

const statusVariant: Record<MatchStatus, 'outline' | 'solid' | 'subtle'> = {
  SCHEDULED: 'outline',
  IN_PROGRESS: 'solid',
  COMPLETED: 'solid',
  CANCELLED: 'subtle',
}

const hasWinner = computed(() => !!props.match.winnerId)

const hasJudgePoints = computed(() => {
  const points = props.match.judgesPoints
  if (!Array.isArray(points)) { return false }
  return points.some(row =>
    row.redCornerJudge1 !== null || row.redCornerJudge2 !== null || row.redCornerJudge3 !== null
    || row.blueCornerJudge1 !== null || row.blueCornerJudge2 !== null || row.blueCornerJudge3 !== null,
  )
})

const isRedWinner = computed(
  () => hasWinner.value && props.match.winnerId === props.match.redCornerId,
)
const isBlueWinner = computed(
  () => hasWinner.value && props.match.winnerId === props.match.blueCornerId,
)
</script>
