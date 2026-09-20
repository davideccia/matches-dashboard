<template>
  <article
    class="flex h-full flex-col overflow-hidden rounded-xl border bg-default shadow-sm transition"
    :class="[
      compact ? '' : 'hover:-translate-y-0.5 hover:shadow-md',
      match.status === 'in_progress' ? 'border-amber-500/60 dark:border-amber-500/50' : 'border-default',
    ]"
  >
    <!-- HEADER: torneo + stato + contesto -->
    <div
      class="border-b border-default"
      :class="compact ? 'px-3 py-2' : 'px-3.5 py-2.5'"
    >
      <div v-if="showTournament && match.tournament?.name" class="mb-2 truncate border-b border-default pb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-highlighted">
        {{ match.tournament.name }}
      </div>

      <div class="flex flex-wrap items-center gap-1.5">
        <span class="size-2 shrink-0 rounded-full" :class="statusDotClass[match.status]" />

        <span v-if="label" class="text-[11px] font-semibold uppercase tracking-wide text-dimmed">{{ label }}</span>

        <template v-if="!compact">
          <span v-if="disciplineWeightLabel" class="rounded-full bg-elevated px-2 py-0.5 text-[11px] font-medium text-toned">
            {{ disciplineWeightLabel }}
          </span>
          <span v-if="match.rounds && match.minutes_per_round" class="rounded-full bg-elevated px-2 py-0.5 text-[11px] font-medium text-toned">
            {{ match.rounds }} × {{ match.minutes_per_round }}'
          </span>

          <span v-if="match.unpaired" class="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            <UIcon name="i-mdi-alert-outline" class="size-3.5" />
            {{ t('match.unpaired') }}
          </span>
        </template>

        <span class="ml-auto shrink-0 text-[11px] font-semibold text-dimmed">#{{ match.sort }}</span>
      </div>
    </div>

    <!-- BODY: rosso / vs / blu -->
    <div class="grid flex-1 grid-cols-[1fr_auto_1fr] items-center">
      <!-- Angolo rosso -->
      <div class="flex min-w-0 gap-2.5 pl-3.5" :class="[compact ? 'py-2' : 'py-3.5', hasWinner && !isRedWinner ? 'opacity-40' : '']">
        <span class="mt-1 w-1 shrink-0 self-stretch rounded-full bg-red-500" />
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <span v-if="!compact" class="text-[10px] font-semibold uppercase tracking-wide text-red-500">{{ t('match.redCorner') }}</span>
          <span
            class="line-clamp-2 min-w-0 break-words font-semibold leading-snug"
            :class="[redNameSizeClass, redCorner.missing ? 'text-amber-600 dark:text-amber-400' : 'text-highlighted']"
          >
            <UIcon v-if="redCorner.missing" name="i-mdi-alert-outline" class="size-4 shrink-0 align-[-2px]" />
            {{ redCorner.name ?? t('match.missingCorner') }}
          </span>
          <span class="line-clamp-1 min-w-0 break-words leading-tight text-muted" :class="redTeamSizeClass">{{ redCorner.team }}</span>
          <span
            v-if="!compact"
            class="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-amber-500"
            :class="isRedWinner && match.end_method ? '' : 'invisible'"
          >
            <UIcon name="i-mdi-trophy" class="size-3.5 shrink-0" />
            <span class="truncate">{{ isRedWinner && match.end_method ? endMethodLabel(match.end_method) : '' }}</span>
          </span>
        </div>
      </div>

      <!-- VS -->
      <div class="flex flex-col items-center justify-center" :class="compact ? 'px-1.5' : 'px-2.5'">
        <span
          class="flex select-none items-center justify-center rounded-full bg-elevated font-semibold uppercase tracking-wide text-dimmed ring-1 ring-default"
          :class="compact ? 'size-6 text-[10px]' : 'size-8 text-xs'"
        >vs</span>
      </div>

      <!-- Angolo blu -->
      <div class="flex min-w-0 flex-row-reverse gap-2.5 pr-3.5 text-right" :class="[compact ? 'py-2' : 'py-3.5', hasWinner && !isBlueWinner ? 'opacity-40' : '']">
        <span class="mt-1 w-1 shrink-0 self-stretch rounded-full bg-blue-500" />
        <div class="flex min-w-0 flex-1 flex-col items-end gap-1">
          <span v-if="!compact" class="text-[10px] font-semibold uppercase tracking-wide text-blue-500">{{ t('match.blueCorner') }}</span>
          <span
            class="line-clamp-2 min-w-0 break-words font-semibold leading-snug"
            :class="[blueNameSizeClass, blueCorner.missing ? 'text-amber-600 dark:text-amber-400' : 'text-highlighted']"
          >
            <UIcon v-if="blueCorner.missing" name="i-mdi-alert-outline" class="size-4 shrink-0 align-[-2px]" />
            {{ blueCorner.name ?? t('match.missingCorner') }}
          </span>
          <span class="line-clamp-1 min-w-0 break-words leading-tight text-muted" :class="blueTeamSizeClass">{{ blueCorner.team }}</span>
          <span
            v-if="!compact"
            class="inline-flex flex-row-reverse items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-amber-500"
            :class="isBlueWinner && match.end_method ? '' : 'invisible'"
          >
            <UIcon name="i-mdi-trophy" class="size-3.5 shrink-0" />
            <span class="truncate">{{ isBlueWinner && match.end_method ? endMethodLabel(match.end_method) : '' }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- BANNER esito: sempre presente, spinto in basso -->
    <div
      class="mt-auto flex flex-wrap items-baseline gap-2 border-t border-default"
      :class="[compact ? 'px-3 py-1.5' : 'px-3.5 py-2', banner.class]"
    >
      <span v-if="banner.kicker" class="text-[11px] uppercase tracking-wide opacity-70">{{ banner.kicker }}</span>
      <span class="font-semibold uppercase" :class="compact ? 'text-[11px]' : 'text-xs'">{{ banner.value }}</span>
      <span v-if="banner.meta" class="ml-auto text-[11px] font-medium uppercase tracking-wide opacity-70">{{ banner.meta }}</span>
    </div>

    <template v-if="!compact">
      <!-- FOOTER: cartellini giudici -->
      <div v-if="showJudgesPoints && hasJudgePoints" class="flex items-center justify-between gap-3 border-t border-default px-3.5 py-2">
        <span class="text-[11px] font-medium uppercase tracking-wide text-dimmed">
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
      <div v-if="!hideNotes" class="flex items-start gap-2 border-t border-default bg-elevated/40 px-3.5 py-2">
        <UIcon name="i-mdi-note-text-outline" class="mt-px size-3.5 shrink-0 text-dimmed" />
        <div class="min-w-0 flex-1">
          <span class="block text-[11px] font-medium uppercase tracking-wide text-dimmed">{{ t('match.notes') }}</span>
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
  /** Mostra il nome del torneo come riga sopra le info disciplina/sort. */
  showTournament?: boolean
}>()

const showJudgesPoints = computed(() => (props.compact ? false : (props.showJudgesPoints ?? true)))
const compact = computed(() => props.compact ?? false)
const hideNotes = computed(() => props.hideNotes ?? false)
const showTournament = computed(() => props.showTournament ?? false)

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

const NAME_SIZE_TIERS = [
  { maxLength: 16, full: 'text-sm sm:text-base', compact: 'text-xs sm:text-sm' },
  { maxLength: 22, full: 'text-xs sm:text-sm', compact: 'text-[11px] sm:text-xs' },
  { maxLength: 30, full: 'text-[11px] sm:text-xs', compact: 'text-[10px] sm:text-[11px]' },
] as const
const NAME_SIZE_FALLBACK = { full: 'text-[10px] sm:text-[11px]', compact: 'text-[9px] sm:text-[10px]' }

const TEAM_SIZE_TIERS = [
  { maxLength: 20, full: 'text-[11px] sm:text-xs', compact: 'text-[10px] sm:text-[11px]' },
  { maxLength: 28, full: 'text-[10px] sm:text-[11px]', compact: 'text-[9px] sm:text-[10px]' },
] as const
const TEAM_SIZE_FALLBACK = { full: 'text-[9px] sm:text-[10px]', compact: 'text-[8px] sm:text-[9px]' }

function nameSizeClass(name: string | null | undefined): string {
  const length = name?.length ?? 0
  const tier = NAME_SIZE_TIERS.find(candidate => length <= candidate.maxLength) ?? NAME_SIZE_FALLBACK
  return compact.value ? tier.compact : tier.full
}

function teamSizeClass(team: string | null | undefined): string {
  const length = team?.length ?? 0
  const tier = TEAM_SIZE_TIERS.find(candidate => length <= candidate.maxLength) ?? TEAM_SIZE_FALLBACK
  return compact.value ? tier.compact : tier.full
}

const redNameSizeClass = computed(() => nameSizeClass(redCorner.value.name))
const blueNameSizeClass = computed(() => nameSizeClass(blueCorner.value.name))
const redTeamSizeClass = computed(() => teamSizeClass(redCorner.value.team))
const blueTeamSizeClass = computed(() => teamSizeClass(blueCorner.value.team))

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
