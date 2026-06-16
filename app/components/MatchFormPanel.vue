<template>
  <USlideover
    v-model:open="open"
    :title="isEdit ? t('match.editTitle') : t('match.createTitle')"
    :ui="{ content: 'sm:max-w-none sm:w-[50vw]' }"
  >
    <template #body>
      <UForm :schema="schema" :state="state" class="flex flex-col h-full" @submit="onSubmit">
        <UTabs
          v-model="activeTab"
          :items="tabs"
          class="flex-1 flex flex-col"
          :ui="{ content: 'flex-1 overflow-y-auto' }"
        >
          <!-- ── TAB: Dettagli ────────────────────────────────────────── -->
          <template #details>
            <div class="space-y-6 p-6">
              <!-- Section 1: Filters -->
              <UFormField name="tournamentId" :label="t('match.tournament')" required>
                <div class="flex items-center gap-2">
                  <ApiSelectMenu
                    v-model="state.tournamentId"
                    endpoint="/api/admin/tournaments"
                    label-key="name"
                    :placeholder="t('match.selectTournament')"
                    :disabled="filtersLocked"
                    class="w-full"
                  />
                  <UButton
                    v-if="state.tournamentId !== null && !filtersLocked"
                    type="button"
                    icon="i-mdi-close"
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    :aria-label="t('common.cancel')"
                    @click="state.tournamentId = null"
                  />
                </div>
              </UFormField>

              <UFormField name="disciplineId" :label="t('match.discipline')" required>
                <div class="flex items-center gap-2">
                  <ApiSelectMenu
                    v-model="state.disciplineId"
                    endpoint="/api/admin/disciplines"
                    label-key="label"
                    :placeholder="t('match.selectDiscipline')"
                    :disabled="filtersLocked"
                    class="w-full"
                  />
                  <UButton
                    v-if="state.disciplineId !== null && !filtersLocked"
                    type="button"
                    icon="i-mdi-close"
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    :aria-label="t('common.cancel')"
                    @click="state.disciplineId = null"
                  />
                </div>
              </UFormField>

              <UFormField name="weightCategoryId" :label="t('match.weightCategory')" required>
                <div class="flex items-center gap-2">
                  <ApiSelectMenu
                    v-model="state.weightCategoryId"
                    endpoint="/api/admin/weight_categories"
                    label-key="label"
                    :placeholder="t('match.selectWeightCategory')"
                    :disabled="filtersLocked"
                    class="w-full"
                  />
                  <UButton
                    v-if="state.weightCategoryId !== null && !filtersLocked"
                    type="button"
                    icon="i-mdi-close"
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    :aria-label="t('common.cancel')"
                    @click="state.weightCategoryId = null"
                  />
                </div>
              </UFormField>

              <!-- Gender filter -->
              <UFormField :label="t('match.gender.label')" required>
                <div class="flex gap-2">
                  <UButton
                    type="button"
                    size="sm"
                    class="flex-1"
                    :variant="genderFilter === 'MALE' ? 'solid' : 'outline'"
                    color="primary"
                    :disabled="filtersLocked"
                    @click="genderFilter = 'MALE'"
                  >
                    {{ t('match.gender.MALE') }}
                  </UButton>
                  <UButton
                    type="button"
                    size="sm"
                    class="flex-1"
                    :variant="genderFilter === 'FEMALE' ? 'solid' : 'outline'"
                    color="primary"
                    :disabled="filtersLocked"
                    @click="genderFilter = 'FEMALE'"
                  >
                    {{ t('match.gender.FEMALE') }}
                  </UButton>
                  <UButton
                    type="button"
                    size="sm"
                    class="flex-1"
                    :variant="genderFilter === 'HYBRID' ? 'solid' : 'outline'"
                    color="neutral"
                    :disabled="filtersLocked"
                    @click="genderFilter = 'HYBRID'"
                  >
                    {{ t('match.gender.HYBRID') }}
                  </UButton>
                </div>
              </UFormField>

              <!-- Hint when filters not ready yet (create mode only) -->
              <UAlert
                v-if="!isEdit && !filtersReady && !forceEntry"
                color="neutral"
                variant="subtle"
                icon="i-mdi-information-outline"
                :description="t('match.selectFiltersHint')"
              />

              <!-- Force entry toggle -->
              <div class="flex items-center gap-3">
                <USwitch v-model="forceEntry" color="warning" />
                <span class="text-sm font-medium text-warning">{{ t('match.forceEntry') }}</span>
              </div>

              <USeparator />

              <!-- Rounds + minutes per round -->
              <div class="grid grid-cols-2 gap-4">
                <UFormField name="rounds" :label="t('match.rounds')" required>
                  <UInput
                    v-model="state.rounds"
                    type="number"
                    min="1"
                    max="10"
                    class="w-full"
                  />
                </UFormField>

                <UFormField name="minutesPerRound" :label="t('match.minutesPerRound')" required>
                  <UInput
                    v-model="state.minutesPerRound"
                    type="number"
                    min="0"
                    step="0.5"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <!-- Section 2: Athletes -->
              <div class="rounded-xl border border-default overflow-hidden">
                <!-- Corner header -->
                <div class="grid grid-cols-[1fr_auto_1fr]">
                  <div class="flex items-center gap-2 px-4 py-2.5 bg-red-500/8 border-b border-default">
                    <span class="size-2.5 rounded-full bg-red-500 shrink-0" />
                    <span class="text-xs font-semibold uppercase tracking-wider text-red-500">
                      {{ t('match.redCorner') }}
                    </span>
                  </div>
                  <div class="w-px bg-default border-b border-default" />
                  <div class="flex items-center justify-end gap-2 px-4 py-2.5 bg-blue-500/8 border-b border-default">
                    <span class="text-xs font-semibold uppercase tracking-wider text-blue-500">
                      {{ t('match.blueCorner') }}
                    </span>
                    <span class="size-2.5 rounded-full bg-blue-500 shrink-0" />
                  </div>
                </div>

                <!-- Corner fields -->
                <div class="grid grid-cols-[1fr_auto_1fr]">
                  <!-- Red corner fields -->
                  <div class="flex flex-col gap-3 p-4 bg-red-500/4">
                    <UFormField name="redCornerId" :label="t('match.athlete')" :required="!isEdit">
                      <div class="flex items-center gap-1.5">
                        <ApiSelectMenu
                          v-model="state.redCornerId"
                          endpoint="/api/admin/athletes"
                          label-key="fullName"
                          :placeholder="t('match.selectAthlete')"
                          :disabled="!filtersReady && !forceEntry"
                          :query-params="filterParams"
                          class="w-full"
                          @select="onRedCornerSelect"
                        />
                        <UButton
                          v-if="state.redCornerId !== null && (filtersReady || forceEntry)"
                          type="button"
                          icon="i-mdi-close"
                          variant="ghost"
                          color="neutral"
                          size="xs"
                          :aria-label="t('common.cancel')"
                          @click="state.redCornerId = null"
                        />
                      </div>
                    </UFormField>

                    <UFormField name="redCornerTeam" :label="t('match.team')" :required="!isEdit">
                      <UInput v-model="state.redCornerTeam" class="w-full" size="sm" />
                    </UFormField>
                  </div>

                  <!-- Vertical divider -->
                  <div class="w-px bg-default self-stretch" />

                  <!-- Blue corner fields -->
                  <div class="flex flex-col gap-3 p-4 bg-blue-500/4">
                    <UFormField name="blueCornerId" :label="t('match.athlete')" :required="!isEdit">
                      <div class="flex items-center gap-1.5">
                        <ApiSelectMenu
                          v-model="state.blueCornerId"
                          endpoint="/api/admin/athletes"
                          label-key="fullName"
                          :placeholder="t('match.selectAthlete')"
                          :disabled="!filtersReady && !forceEntry"
                          :query-params="filterParams"
                          class="w-full"
                          @select="onBlueCornerSelect"
                        />
                        <UButton
                          v-if="state.blueCornerId !== null && (filtersReady || forceEntry)"
                          type="button"
                          icon="i-mdi-close"
                          variant="ghost"
                          color="neutral"
                          size="xs"
                          :aria-label="t('common.cancel')"
                          @click="state.blueCornerId = null"
                        />
                      </div>
                    </UFormField>

                    <UFormField name="blueCornerTeam" :label="t('match.team')" :required="!isEdit">
                      <UInput v-model="state.blueCornerTeam" class="w-full" size="sm" />
                    </UFormField>
                  </div>
                </div>
              </div>

              <USeparator />

              <!-- Sort & Scheduled time -->
              <UFormField name="sort" :label="t('match.sort')" :required="!isEdit">
                <UInput v-model="state.sort" type="number" min="1" class="w-full" />
              </UFormField>

              <UFormField name="scheduledTime" :label="t('match.scheduledTime')">
                <div class="flex items-center gap-2">
                  <UInput v-model="state.scheduledTime" type="time" class="w-full" />
                  <UButton
                    v-if="state.scheduledTime"
                    type="button"
                    icon="i-mdi-close"
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    :aria-label="t('common.cancel')"
                    @click="state.scheduledTime = undefined"
                  />
                </div>
              </UFormField>
            </div>
          </template>

          <!-- ── TAB: Esito ───────────────────────────────────────────── -->
          <template #outcome>
            <div class="space-y-6 p-6">
              <!-- Match preview card (inspired by MatchCardReadOnly) -->
              <div class="rounded-xl border border-default bg-elevated/50 overflow-hidden">
                <!-- Corner VS layout -->
                <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 px-4 py-4">
                  <!-- Red corner -->
                  <div
                    class="flex flex-col gap-0.5 transition-opacity"
                    :class="isRedWinner ? 'opacity-100' : hasWinner ? 'opacity-40' : ''"
                  >
                    <div class="flex items-center gap-1.5">
                      <span class="size-2.5 rounded-full bg-red-500 shrink-0" />
                      <span class="font-semibold text-highlighted text-sm leading-tight truncate">
                        {{ redCornerLabel }}
                      </span>
                      <UIcon
                        v-if="isRedWinner"
                        name="i-mdi-trophy"
                        class="size-3.5 text-warning shrink-0"
                      />
                    </div>
                    <span class="pl-4 text-xs text-muted truncate">{{ state.redCornerTeam || '—' }}</span>
                  </div>

                  <!-- VS -->
                  <span class="text-xs font-bold tracking-widest uppercase text-muted select-none">vs</span>

                  <!-- Blue corner -->
                  <div
                    class="flex flex-col gap-0.5 items-end transition-opacity"
                    :class="isBlueWinner ? 'opacity-100' : hasWinner ? 'opacity-40' : ''"
                  >
                    <div class="flex items-center gap-1.5">
                      <UIcon
                        v-if="isBlueWinner"
                        name="i-mdi-trophy"
                        class="size-3.5 text-warning shrink-0"
                      />
                      <span class="font-semibold text-highlighted text-sm leading-tight truncate">
                        {{ blueCornerLabel }}
                      </span>
                      <span class="size-2.5 rounded-full bg-blue-500 shrink-0" />
                    </div>
                    <span class="pr-4 text-xs text-muted truncate">{{ state.blueCornerTeam || '—' }}</span>
                  </div>
                </div>

                <!-- Winner selection row -->
                <div class="border-t border-default px-4 py-3 bg-default/50">
                  <p class="text-xs text-muted mb-2 font-medium uppercase tracking-wide">
                    {{ t('match.winner') }}
                  </p>
                  <div class="flex gap-2">
                    <UButton
                      type="button"
                      size="sm"
                      class="flex-1"
                      :variant="state.winnerId === null ? 'solid' : 'outline'"
                      color="neutral"
                      :disabled="winnerControlDisabled"
                      @click="setWinner(null)"
                    >
                      {{ t('match.noWinner') }}
                    </UButton>
                    <UButton
                      type="button"
                      size="sm"
                      class="flex-1"
                      :variant="isRedWinner ? 'solid' : 'outline'"
                      color="error"
                      :disabled="!state.redCornerId"
                      @click="setWinner(state.redCornerId)"
                    >
                      {{ t('match.redCorner') }}
                    </UButton>
                    <UButton
                      type="button"
                      size="sm"
                      class="flex-1"
                      :variant="isBlueWinner ? 'solid' : 'outline'"
                      color="info"
                      :disabled="!state.blueCornerId"
                      @click="setWinner(state.blueCornerId)"
                    >
                      {{ t('match.blueCorner') }}
                    </UButton>
                  </div>
                </div>

                <!-- Result banner -->
                <div
                  v-if="hasWinner"
                  class="flex items-center justify-center gap-1.5 border-t border-default px-4 py-2.5 bg-success/10 text-xs font-medium text-success"
                >
                  <UIcon name="i-mdi-medal-outline" class="size-3.5" />
                  {{ winnerLabel }}
                </div>
                <div
                  v-else
                  class="flex items-center justify-center gap-1.5 border-t border-default px-4 py-2.5 text-xs text-muted border-dashed"
                >
                  <UIcon name="i-mdi-clock-outline" class="size-3.5" />
                  {{ t('match.noWinner') }}
                </div>
              </div>

              <!-- Status + End method -->
              <div class="grid grid-cols-2 gap-4">
                <UFormField name="status" :label="t('match.status.label')" required>
                  <USelect v-model="state.status" :items="statusOptions" class="w-full" />
                </UFormField>

                <UFormField name="endMethod" :label="t('match.endMethod.label')">
                  <USelect v-model="state.endMethod" :items="endMethodOptions" class="w-full" />
                </UFormField>
              </div>

              <UFormField name="endRound" :label="t('match.endRound')">
                <div class="flex items-center gap-2">
                  <UInput v-model="state.endRound" class="w-full" />
                  <UButton
                    v-if="state.endRound"
                    type="button"
                    icon="i-mdi-close"
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    :aria-label="t('common.cancel')"
                    @click="state.endRound = undefined"
                  />
                </div>
              </UFormField>

              <!-- Judges points table -->
              <MatchJudgesPointsTable v-model="state.judgesPoints" :rounds="state.rounds" />
            </div>
          </template>
        </UTabs>

        <!-- Sticky footer -->
        <div class="flex justify-end gap-2 px-6 py-4 border-t border-default shrink-0">
          <UButton variant="ghost" color="neutral" type="button" @click="open = false">
            {{ t('common.cancel') }}
          </UButton>
          <UButton type="submit" :loading="loading">
            {{ t('common.save') }}
          </UButton>
        </div>
      </UForm>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { JudgePointsRow, Match } from '~/types/models'
import * as z from 'zod'
import { type Gender, MATCH_STATUSES, type MatchStatus } from '~/utils/constants'

const props = defineProps<{
  item: Match | null
  initialTab?: 'details' | 'outcome'
}>()

const emit = defineEmits<{
  saved: []
}>()

const open = defineModel<boolean>({ default: false })
const { t } = useI18n()
const api = useApi()
const toast = useToast()

const isEdit = computed(() => props.item !== null)

// ── Tabs ─────────────────────────────────────────────────────────────────────
const activeTab = ref('details')

const tabs = computed(() => [
  { label: t('match.tab.details'), slot: 'details', value: 'details' },
  { label: t('match.tab.outcome'), slot: 'outcome', value: 'outcome' },
])

// ── Form state ───────────────────────────────────────────────────────────────
const state = reactive({
  tournamentId: null as string | null,
  redCornerId: null as string | null,
  blueCornerId: null as string | null,
  weightCategoryId: null as string | null,
  disciplineId: null as string | null,
  redCornerTeam: '',
  blueCornerTeam: '',
  sort: 1 as number,
  scheduledTime: undefined as string | undefined,
  status: 'SCHEDULED' as MatchStatus,
  winnerId: null as string | null,
  endMethod: null as string | null,
  rounds: null as number | null,
  minutesPerRound: null as number | null,
  endRound: undefined as string | undefined,
  judgesPoints: [] as JudgePointsRow[],
})

// ── Gender filter (mandatory, defaults to MALE) ───────────────────────────────
const genderFilter = ref<Gender>('MALE')

// ── Force entry (UI-only: bypasses athlete filters when true) ─────────────────
const forceEntry = ref(false)

// ── Filter state ────────────────────────────────────────────────────────────
const filtersLocked = computed(() => false)
const initializing = ref(false)

const filtersReady = computed(() =>
  !!state.tournamentId && !!state.disciplineId && !!state.weightCategoryId,
)

const filterParams = computed(() => {
  const gender = genderFilter.value === 'HYBRID' ? undefined : genderFilter.value
  return forceEntry.value
    ? { gender }
    : {
        tournamentId: state.tournamentId ?? undefined,
        disciplineId: state.disciplineId ?? undefined,
        weightCategoryId: state.weightCategoryId ?? undefined,
        validOnly: true as const,
        gender,
      }
})

// ── Status / end-method options ─────────────────────────────────────────────
const statusOptions = computed(() => [
  { label: t('match.status.SCHEDULED'), value: 'SCHEDULED' },
  { label: t('match.status.IN_PROGRESS'), value: 'IN_PROGRESS' },
  { label: t('match.status.COMPLETED'), value: 'COMPLETED' },
  { label: t('match.status.CANCELLED'), value: 'CANCELLED' },
])

const endMethodOptions = computed(() => [
  { label: t('match.noEndMethod'), value: null },
  { label: t('match.endMethod.VICTORY_UNANIMOUS_DECISION'), value: 'VICTORY_UNANIMOUS_DECISION' },
  { label: t('match.endMethod.VICTORY_SPLIT_DECISION'), value: 'VICTORY_SPLIT_DECISION' },
  { label: t('match.endMethod.VICTORY_KO'), value: 'VICTORY_KO' },
  { label: t('match.endMethod.VICTORY_TKO'), value: 'VICTORY_TKO' },
  { label: t('match.endMethod.VICTORY_DISQUALIFICATION'), value: 'VICTORY_DISQUALIFICATION' },
  { label: t('match.endMethod.DRAW'), value: 'DRAW' },
  { label: t('match.endMethod.NO_CONTEST'), value: 'NO_CONTEST' },
])

// ── Zod schemas ─────────────────────────────────────────────────────────────
const createSchema = z.object({
  tournamentId: z.string().min(1),
  redCornerId: z.string().min(1),
  blueCornerId: z.string().min(1),
  weightCategoryId: z.string().min(1),
  disciplineId: z.string().min(1),
  redCornerTeam: z.string().min(1),
  blueCornerTeam: z.string().min(1),
  sort: z.coerce.number().int().min(1),
  scheduledTime: z.string().optional().nullable(),
  status: z.enum(MATCH_STATUSES).optional(),
  winnerId: z.string().optional().nullable(),
  endMethod: z.string().optional().nullable(),
  rounds: z.coerce.number().int().min(1).max(10),
  minutesPerRound: z.coerce.number().min(1),
  endRound: z.string().optional().nullable(),
  judgesPoints: z.any().optional().nullable(),
})

const editSchema = z.object({
  redCornerId: z.string().optional().nullable(),
  blueCornerId: z.string().optional().nullable(),
  weightCategoryId: z.string().optional().nullable(),
  disciplineId: z.string().optional().nullable(),
  redCornerTeam: z.string().optional(),
  blueCornerTeam: z.string().optional(),
  sort: z.coerce.number().int().min(1).optional(),
  scheduledTime: z.string().optional().nullable(),
  status: z.enum(MATCH_STATUSES).optional(),
  winnerId: z.string().optional().nullable(),
  endMethod: z.string().optional().nullable(),
  rounds: z.coerce.number().int().min(1).max(10),
  minutesPerRound: z.coerce.number().min(1),
  endRound: z.string().optional().nullable(),
  judgesPoints: z.any().optional().nullable(),
})

const schema = computed(() => isEdit.value ? editSchema : createSchema)

// ── Populate state when slideover opens ─────────────────────────────────────
watch(open, async (val) => {
  if (val) {
    initializing.value = true
    activeTab.value = props.initialTab ?? 'details'
    forceEntry.value = props.item?.forced ?? false
    genderFilter.value = props.item?.gender ?? 'MALE'
    state.tournamentId = props.item?.tournamentId ?? null
    state.redCornerId = props.item?.redCornerId ?? null
    state.blueCornerId = props.item?.blueCornerId ?? null
    state.weightCategoryId = props.item?.weightCategoryId ?? null
    state.disciplineId = props.item?.disciplineId ?? null
    state.redCornerTeam = props.item?.redCornerTeam ?? ''
    state.blueCornerTeam = props.item?.blueCornerTeam ?? ''
    state.sort = props.item?.sort ?? 1
    state.scheduledTime = props.item?.scheduledTime ?? undefined
    state.status = props.item?.status ?? 'SCHEDULED'
    state.winnerId = props.item?.winnerId ?? null
    state.endMethod = props.item?.endMethod ?? null
    state.rounds = props.item?.rounds ?? null
    state.minutesPerRound = props.item?.minutesPerRound ?? null
    state.endRound = props.item?.endRound ?? undefined
    state.judgesPoints = props.item?.judgesPoints ?? []
    await nextTick()
    initializing.value = false
  }
})

// ── When filters change (create mode), reset athlete selections ──────────────
watch(
  () => [state.tournamentId, state.disciplineId, state.weightCategoryId],
  () => {
    if (initializing.value) { return }
    state.redCornerId = null
    state.blueCornerId = null
    state.winnerId = null
  },
)

// ── When gender filter changes, reset athlete selections ─────────────────────
watch(genderFilter, () => {
  if (initializing.value) { return }
  state.redCornerId = null
  state.blueCornerId = null
  state.winnerId = null
})

// ── When a corner athlete changes, reset winner if it was that athlete ────────
watch(() => state.redCornerId, (val) => {
  if (state.winnerId !== null && state.winnerId !== val && state.winnerId !== state.blueCornerId) {
    state.winnerId = null
  }
})
watch(() => state.blueCornerId, (val) => {
  if (state.winnerId !== null && state.winnerId !== state.redCornerId && state.winnerId !== val) {
    state.winnerId = null
  }
})

// ── Sync judgesPoints rows when rounds changes ────────────────────────────────
watch(() => state.rounds, (val) => {
  if (!val || val <= 0) { return }
  const n = Math.min(val, 10)
  const current = state.judgesPoints
  state.judgesPoints = Array.from({ length: n }, (_, i) => {
    const existing = current.find(r => r.round === i + 1)
    return existing ?? {
      round: i + 1,
      redCornerJudge1: null,
      redCornerJudge2: null,
      redCornerJudge3: null,
      blueCornerJudge1: null,
      blueCornerJudge2: null,
      blueCornerJudge3: null,
    }
  })
})

// ── Winner helpers ────────────────────────────────────────────────────────────
const winnerControlDisabled = computed(
  () => !state.redCornerId && !state.blueCornerId,
)

function setWinner(value: string | null) {
  state.winnerId = value
}

// ── Auto-fill team from selected athlete object ───────────────────────────────
function onRedCornerSelect(item: Record<string, unknown>) {
  state.redCornerTeam = String(item.teamName ?? '')
}

function onBlueCornerSelect(item: Record<string, unknown>) {
  state.blueCornerTeam = String(item.teamName ?? '')
}

// ── Corner display labels (resolved from props.item in edit, placeholder in create) ──
const redCornerLabel = computed(() => {
  if (props.item?.redCornerFullName) { return props.item.redCornerFullName }
  return state.redCornerId ? `#${state.redCornerId.slice(0, 6)}` : t('match.redCorner')
})
const blueCornerLabel = computed(() => {
  if (props.item?.blueCornerFullName) { return props.item.blueCornerFullName }
  return state.blueCornerId ? `#${state.blueCornerId.slice(0, 6)}` : t('match.blueCorner')
})
const winnerLabel = computed(() => {
  if (!state.winnerId) { return null }
  if (state.winnerId === state.redCornerId) { return redCornerLabel.value }
  if (state.winnerId === state.blueCornerId) { return blueCornerLabel.value }
  return props.item?.winnerFullName ?? t('match.winner')
})

const hasWinner = computed(() => !!state.winnerId)
const isRedWinner = computed(() => hasWinner.value && state.winnerId === state.redCornerId)
const isBlueWinner = computed(() => hasWinner.value && state.winnerId === state.blueCornerId)

// ── Submit ───────────────────────────────────────────────────────────────────
const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<z.infer<typeof createSchema> | z.infer<typeof editSchema>>) {
  loading.value = true
  try {
    const hasAnyPoints = state.judgesPoints.some(row =>
      row.redCornerJudge1 !== null || row.redCornerJudge2 !== null || row.redCornerJudge3 !== null
      || row.blueCornerJudge1 !== null || row.blueCornerJudge2 !== null || row.blueCornerJudge3 !== null,
    )
    const judgesPoints = hasAnyPoints ? state.judgesPoints : null

    if (isEdit.value) {
      const body = {
        redCornerId: event.data.redCornerId || null,
        blueCornerId: event.data.blueCornerId || null,
        weightCategoryId: event.data.weightCategoryId || null,
        disciplineId: event.data.disciplineId || null,
        redCornerTeam: event.data.redCornerTeam || undefined,
        blueCornerTeam: event.data.blueCornerTeam || undefined,
        sort: event.data.sort ?? undefined,
        scheduledTime: event.data.scheduledTime || null,
        status: event.data.status,
        winnerId: event.data.winnerId || null,
        endMethod: event.data.endMethod || null,
        rounds: event.data.rounds,
        minutesPerRound: event.data.minutesPerRound,
        endRound: event.data.endRound || null,
        forced: forceEntry.value,
        gender: genderFilter.value,
        judgesPoints,
      }
      await api.put(`/api/admin/matches/${props.item!.id}`, body)
    } else {
      const createData = event.data as z.infer<typeof createSchema>
      const body = {
        tournamentId: createData.tournamentId,
        redCornerId: createData.redCornerId,
        blueCornerId: createData.blueCornerId,
        weightCategoryId: createData.weightCategoryId,
        disciplineId: createData.disciplineId,
        redCornerTeam: createData.redCornerTeam,
        blueCornerTeam: createData.blueCornerTeam,
        sort: createData.sort,
        scheduledTime: createData.scheduledTime || null,
        status: createData.status ?? 'SCHEDULED',
        winnerId: createData.winnerId || null,
        endMethod: createData.endMethod || null,
        rounds: createData.rounds,
        minutesPerRound: createData.minutesPerRound,
        endRound: createData.endRound || null,
        forced: forceEntry.value,
        gender: genderFilter.value,
        judgesPoints,
      }
      await api.post('/api/admin/matches', body)
    }

    emit('saved')
    toast.add({
      title: isEdit.value ? t('match.updated') : t('match.created'),
      color: 'success',
    })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>
