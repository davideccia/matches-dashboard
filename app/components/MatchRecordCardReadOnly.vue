<template>
  <article
    class="flex h-full flex-col overflow-hidden bg-default shadow-md transition"
    :class="[
      compact ? 'rounded-xl border-2' : 'rounded-2xl border-4 hover:-translate-y-0.5 hover:shadow-lg',
      match.status === 'in_progress' ? 'border-amber-500 dark:border-amber-500' : 'border-inverted dark:border-accented',
    ]"
  >
    <!-- HEADER: stato + contesto -->
    <div
      class="flex flex-wrap items-center gap-2 border-b-2 border-default"
      :class="compact ? 'px-3 py-2' : 'px-4 py-3'"
    >
      <span class="size-2 shrink-0 rounded-full" :class="statusDotClass[match.status]" />

      <span v-if="label" class="text-xs font-bold uppercase tracking-widest text-dimmed">{{ label }}</span>

      <template v-if="!compact">
        <span v-if="disciplineWeightLabel" class="rounded-full border border-default px-2.5 py-1 text-xs uppercase tracking-widest">
          {{ disciplineWeightLabel }}
        </span>
        <span v-if="match.rounds && match.minutes_per_round" class="rounded-full border border-default px-2.5 py-1 text-xs uppercase tracking-widest">
          {{ match.rounds }} × {{ match.minutes_per_round }}'
        </span>

        <span v-if="match.unpaired" class="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400">
          <UIcon name="i-mdi-alert-outline" class="size-3.5" />
          {{ t('match.unpaired') }}
        </span>
      </template>

      <span class="ml-auto text-xs font-bold text-dimmed">#{{ match.sort }}</span>
    </div>

    <!-- BODY: rosso / vs / blu -->
    <div class="grid flex-1 grid-cols-[1fr_auto_1fr] items-stretch">
      <!-- Angolo rosso -->
      <div class="flex gap-3 pl-4" :class="[compact ? 'py-2 pr-2' : 'py-5 pr-3', hasWinner && !isRedWinner ? 'opacity-40' : '']">
        <span class="w-1.5 shrink-0 rounded-full bg-red-500" />
        <div class="flex min-w-0 flex-col gap-1.5">
          <span v-if="!compact" class="text-xs uppercase tracking-widest text-red-500">{{ t('match.redCorner') }}</span>
          <span
            class="font-bold leading-tight"
            :class="[compact ? 'text-sm truncate' : 'text-xl', redCorner.missing ? 'text-amber-600 dark:text-amber-400' : 'text-highlighted']"
          >
            <UIcon v-if="redCorner.missing" name="i-mdi-alert-outline" class="size-4 align-[-2px]" />
            {{ redCorner.name ?? t('match.missingCorner') }}
          </span>
          <span class="text-xs leading-tight text-muted truncate">{{ redCorner.team }}</span>
          <span
            v-if="!compact"
            class="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-amber-500"
            :class="isRedWinner && match.end_method ? '' : 'invisible'"
          >
            <UIcon name="i-mdi-trophy" class="size-3.5" />
            {{ isRedWinner && match.end_method ? endMethodLabel(match.end_method) : '' }}
          </span>
        </div>
      </div>

      <!-- VS -->
      <div class="flex flex-col items-center justify-center border-x border-default" :class="compact ? 'px-2 py-2' : 'px-3 py-5'">
        <span class="font-bold uppercase tracking-widest text-dimmed select-none" :class="compact ? 'text-xs' : 'text-sm'">vs</span>
      </div>

      <!-- Angolo blu -->
      <div class="flex flex-row-reverse gap-3 pr-4 text-right" :class="[compact ? 'py-2 pl-2' : 'py-5 pl-3', hasWinner && !isBlueWinner ? 'opacity-40' : '']">
        <span class="w-1.5 shrink-0 rounded-full bg-blue-500" />
        <div class="flex min-w-0 flex-col items-end gap-1.5">
          <span v-if="!compact" class="text-xs uppercase tracking-widest text-blue-500">{{ t('match.blueCorner') }}</span>
          <span
            class="font-bold leading-tight"
            :class="[compact ? 'text-sm truncate' : 'text-xl', blueCorner.missing ? 'text-amber-600 dark:text-amber-400' : 'text-highlighted']"
          >
            <UIcon v-if="blueCorner.missing" name="i-mdi-alert-outline" class="size-4 align-[-2px]" />
            {{ blueCorner.name ?? t('match.missingCorner') }}
          </span>
          <span class="text-xs leading-tight text-muted truncate">{{ blueCorner.team }}</span>
          <span
            v-if="!compact"
            class="inline-flex flex-row-reverse items-center gap-1 text-xs font-bold uppercase tracking-widest text-amber-500"
            :class="isBlueWinner && match.end_method ? '' : 'invisible'"
          >
            <UIcon name="i-mdi-trophy" class="size-3.5" />
            {{ isBlueWinner && match.end_method ? endMethodLabel(match.end_method) : '' }}
          </span>
        </div>
      </div>
    </div>

    <!-- BANNER esito: sempre presente, spinto in basso -->
    <div
      class="mt-auto flex flex-wrap items-baseline gap-2.5 border-t-2 border-default"
      :class="[compact ? 'px-3 py-1.5' : 'px-4 py-3', banner.class]"
    >
      <span v-if="banner.kicker" class="text-xs text-default uppercase tracking-widest opacity-70">{{ banner.kicker }}</span>
      <span class="font-bold uppercase" :class="compact ? 'text-xs' : 'text-sm'">{{ banner.value }}</span>
      <span v-if="banner.meta" class="ml-auto text-xs uppercase tracking-widest opacity-70">{{ banner.meta }}</span>
    </div>

    <template v-if="!compact">
      <!-- FOOTER: cartellini giudici -->
      <div v-if="showJudgesPoints && hasJudgePoints" class="flex items-center justify-between gap-3 border-t border-default px-4 py-2.5">
        <span class="text-xs uppercase tracking-widest text-dimmed">
          {{ t('match.judgesPointsRecorded') }}
        </span>
        <UButton
          type="button"
          variant="outline"
          color="neutral"
          size="xs"
          class="rounded-full"
          icon="i-mdi-clipboard-list-outline"
          @click="judgesPointsOpen = true"
        >
          {{ t('match.judgesPointsTable') }}
        </UButton>
      </div>

      <!-- FOOTER: note -->
      <div v-if="!hideNotes" class="flex items-start gap-2 border-t border-default bg-elevated/50 px-4 py-2.5">
        <UIcon name="i-mdi-note-text-outline" class="mt-px size-3.5 shrink-0 text-dimmed" />
        <div class="min-w-0">
          <span class="block text-xs uppercase tracking-widest text-dimmed">{{ t('match.notes') }}</span>
          <p v-if="notes" class="mt-0.5 text-sm leading-snug whitespace-pre-line text-toned">
            {{ notes }}
          </p>
          <p v-else class="mt-0.5 text-sm leading-snug text-dimmed italic">
            {{ t('match.notesEmpty') }}
          </p>
        </div>
      </div>
    </template>
  </article>

  <UModal v-if="showJudgesPoints" v-model:open="judgesPointsOpen" :title="t('match.judgesPointsTable')">
    <template #body>
      <MatchRecordJudgesPointsTable :model-value="judgesPointsRows" readonly />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { MatchRecord } from '~/types/models'
import type { MatchStatus } from '~/utils/constants'

const props = defineProps<{
  match: MatchRecord
  showJudgesPoints?: boolean
  /** Versione ridotta: nasconde badge contesto, dettagli angoli e footer (giudici/note). */
  compact?: boolean
  /** Etichetta opzionale mostrata nell'header (es. "Precedente"/"Successivo" nella finestra live). */
  label?: string
  /** Nasconde il blocco note (es. vista pubblica). */
  hideNotes?: boolean
}>()

const showJudgesPoints = computed(() => (props.compact ? false : (props.showJudgesPoints ?? true)))
const compact = computed(() => props.compact ?? false)
const hideNotes = computed(() => props.hideNotes ?? false)

const { t } = useI18n()
const judgesPointsOpen = ref(false)

const statusDotClass: Record<MatchStatus, string> = {
  scheduled: 'bg-zinc-400 dark:bg-zinc-500',
  in_progress: 'animate-pulse bg-amber-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-rose-500',
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

const disciplineWeightLabel = computed(() => {
  const parts = [props.match.discipline?.label, props.match.weight_category?.label].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : null
})

const redCorner = computed(() => cornerInfo(props.match, 'red'))
const blueCorner = computed(() => cornerInfo(props.match, 'blue'))

const hasWinner = computed(() => !!props.match.winner_id)
const isRedWinner = computed(() => hasWinner.value && props.match.winner_id === props.match.red_corner_id)
const isBlueWinner = computed(() => hasWinner.value && props.match.winner_id === props.match.blue_corner_id)

const hasJudgePoints = computed(() => {
  const points = props.match.judges_points
  if (!Array.isArray(points) || points.length === 0) { return false }
  return points.some(row =>
    row.judge1_red !== null || row.judge2_red !== null || row.judge3_red !== null
    || row.judge1_blue !== null || row.judge2_blue !== null || row.judge3_blue !== null,
  )
})

const judgesPointsRows = computed(() => props.match.judges_points ?? [])

const notes = computed(() => props.match.notes?.trim() || null)

const banner = computed(() => {
  const m = props.match

  if (m.status === 'completed') {
    return {
      class: 'text-emerald-600 dark:text-emerald-400',
      kicker: null,
      value: t('match.status.completed'),
      meta: m.end_round ? `Round ${m.end_round}` : '',
    }
  }

  if (m.status === 'cancelled') {
    return {
      class: 'text-rose-600 dark:text-rose-400',
      kicker: null,
      value: t('match.status.cancelled'),
      meta: '',
    }
  }

  if (m.status === 'in_progress') {
    return {
      class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      kicker: null,
      value: t('match.status.in_progress'),
      meta: 'Live',
    }
  }

  return {
    class: 'text-muted',
    kicker: null,
    value: t('match.status.scheduled'),
    meta: '',
  }
})
</script>
