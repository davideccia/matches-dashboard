<template>
  <USlideover
    v-model:open="open"
    :title="isEdit ? t('match.editTitle') : t('match.createTitle')"
    :ui="{ content: 'sm:max-w-none sm:w-[50vw]' }"
  >
    <template #body>
      <div v-if="fetching" class="flex items-center justify-center p-12">
        <UIcon name="i-mdi-loading" class="animate-spin text-2xl" />
      </div>
      <UForm
        v-else
        :schema="schema"
        :state="state"
        class="flex flex-col h-full"
        @submit="onSubmit"
      >
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
              <UFormField name="tournament_id" :label="t('match.tournament')" required>
                <div class="flex items-center gap-2">
                  <ApiSelectMenu
                    v-model="state.tournament_id"
                    endpoint="/api/admin/tournaments"
                    label-key="name"
                    :placeholder="t('match.selectTournament')"
                    :disabled="filtersLocked"
                    class="w-full"
                  />
                  <UButton
                    v-if="state.tournament_id !== null && !filtersLocked"
                    type="button"
                    icon="i-mdi-close"
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    :aria-label="t('common.cancel')"
                    @click="() => { state.tournament_id = null }"
                  />
                </div>
              </UFormField>

              <UFormField name="discipline_id" :label="t('match.discipline')" required>
                <div class="flex items-center gap-2">
                  <ApiSelectMenu
                    v-model="state.discipline_id"
                    endpoint="/api/admin/disciplines"
                    label-key="label"
                    :placeholder="t('match.selectDiscipline')"
                    :disabled="filtersLocked"
                    class="w-full"
                    @select="onDisciplineSelect"
                  />
                  <UButton
                    v-if="state.discipline_id !== null && !filtersLocked"
                    type="button"
                    icon="i-mdi-close"
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    :aria-label="t('common.cancel')"
                    @click="() => { state.discipline_id = null }"
                  />
                </div>
              </UFormField>

              <UFormField name="weight_category_id" :label="t('match.weightCategory')" required>
                <div class="flex items-center gap-2">
                  <ApiSelectMenu
                    v-model="state.weight_category_id"
                    endpoint="/api/admin/weight_categories"
                    label-key="label"
                    :placeholder="t('match.selectWeightCategory')"
                    :disabled="filtersLocked"
                    class="w-full"
                  />
                  <UButton
                    v-if="state.weight_category_id !== null && !filtersLocked"
                    type="button"
                    icon="i-mdi-close"
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    :aria-label="t('common.cancel')"
                    @click="() => { state.weight_category_id = null }"
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
                    :variant="genderFilter === 'male' ? 'solid' : 'outline'"
                    color="primary"
                    :disabled="filtersLocked"
                    @click="() => { genderFilter = 'male' }"
                  >
                    {{ t('match.gender.male') }}
                  </UButton>
                  <UButton
                    type="button"
                    size="sm"
                    class="flex-1"
                    :variant="genderFilter === 'female' ? 'solid' : 'outline'"
                    color="primary"
                    :disabled="filtersLocked"
                    @click="() => { genderFilter = 'female' }"
                  >
                    {{ t('match.gender.female') }}
                  </UButton>
                  <UButton
                    type="button"
                    size="sm"
                    class="flex-1"
                    :variant="genderFilter === 'hybrid' ? 'solid' : 'outline'"
                    color="neutral"
                    :disabled="filtersLocked"
                    @click="() => { genderFilter = 'hybrid' }"
                  >
                    {{ t('match.gender.hybrid') }}
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

                <UFormField name="minutes_per_round" :label="t('match.minutesPerRound')" required>
                  <div class="flex items-center gap-2">
                    <UInput
                      v-model="state.minutes_per_round"
                      type="time"
                      class="w-full"
                    />
                  </div>
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
                    <UFormField name="red_corner_id" :label="t('match.athlete')" :required="!isEdit">
                      <div class="flex items-center gap-1.5">
                        <ApiSelectMenu
                          v-model="state.red_corner_id"
                          endpoint="/api/admin/athletes"
                          label-key="full_name"
                          :paginated="false"
                          :placeholder="t('match.selectAthlete')"
                          :disabled="!filtersReady && !forceEntry"
                          :query-params="filterParams"
                          class="w-full"
                          @select="onRedCornerSelect"
                        >
                          <template #label="{ item: slotItem }">
                            <span class="flex items-center gap-2 min-w-0 w-full">
                              <span class="truncate flex-1">{{ slotItem.full_name }}</span>
                              <UBadge v-if="slotItem.is_adult" color="success" variant="subtle" size="sm">{{ t('athlete.adult') }}</UBadge>
                              <UBadge v-else color="warning" variant="subtle" size="sm">{{ t('athlete.minor') }}</UBadge>
                              <span
                                v-if="slotItem.match_records_count != null"
                                class="inline-flex items-center gap-1 shrink-0 rounded-full border border-muted bg-elevated px-1.5 py-px text-[11px] font-medium text-muted"
                              >
                                <UIcon name="i-mdi-boxing-glove" class="size-4 opacity-70 bg-red-400" />
                                {{ slotItem.match_records_count }}
                              </span>
                            </span>
                          </template>
                        </ApiSelectMenu>
                        <UButton
                          v-if="state.red_corner_id !== null && (filtersReady || forceEntry)"
                          type="button"
                          icon="i-mdi-close"
                          variant="ghost"
                          color="neutral"
                          size="xs"
                          :aria-label="t('common.cancel')"
                          @click="() => { state.red_corner_id = null }"
                        />
                      </div>
                    </UFormField>

                    <UFormField name="red_corner_team" :label="t('match.team')" :required="!isEdit">
                      <UInput v-model="state.red_corner_team" class="w-full" size="sm" />
                    </UFormField>
                  </div>

                  <!-- Vertical divider -->
                  <div class="w-px bg-default self-stretch" />

                  <!-- Blue corner fields -->
                  <div class="flex flex-col gap-3 p-4 bg-blue-500/4">
                    <UFormField name="blue_corner_id" :label="t('match.athlete')" :required="!isEdit">
                      <div class="flex items-center gap-1.5">
                        <ApiSelectMenu
                          v-model="state.blue_corner_id"
                          endpoint="/api/admin/athletes"
                          label-key="full_name"
                          :paginated="false"
                          :placeholder="t('match.selectAthlete')"
                          :disabled="!filtersReady && !forceEntry"
                          :query-params="filterParams"
                          class="w-full"
                          @select="onBlueCornerSelect"
                        >
                          <template #label="{ item: slotItem }">
                            <span class="flex items-center gap-2 min-w-0 w-full">
                              <span class="truncate flex-1">{{ slotItem.full_name }}</span>
                              <UBadge v-if="slotItem.is_adult" color="success" variant="subtle" size="xs">{{ t('athlete.adult') }}</UBadge>
                              <UBadge v-else color="warning" variant="subtle" size="xs">{{ t('athlete.minor') }}</UBadge>
                              <span
                                v-if="slotItem.match_records_count != null"
                                class="inline-flex items-center gap-1 shrink-0 rounded-full border border-muted bg-elevated px-1.5 py-px text-[11px] font-medium text-muted"
                              >
                                <UIcon name="i-mdi-boxing-glove" class="size-4 opacity-70 bg-blue-400" />
                                {{ slotItem.match_records_count }}
                              </span>
                            </span>
                          </template>
                        </ApiSelectMenu>
                        <UButton
                          v-if="state.blue_corner_id !== null && (filtersReady || forceEntry)"
                          type="button"
                          icon="i-mdi-close"
                          variant="ghost"
                          color="neutral"
                          size="xs"
                          :aria-label="t('common.cancel')"
                          @click="() => { state.blue_corner_id = null }"
                        />
                      </div>
                    </UFormField>

                    <UFormField name="blue_corner_team" :label="t('match.team')" :required="!isEdit">
                      <UInput v-model="state.blue_corner_team" class="w-full" size="sm" />
                    </UFormField>
                  </div>
                </div>
              </div>

              <USeparator />

              <!-- Sort & Scheduled time -->
              <UFormField name="sort" :label="t('match.sort')" :required="!isEdit">
                <UInput v-model="state.sort" type="number" min="1" class="w-full" />
              </UFormField>

              <UFormField name="scheduled_time" :label="t('match.scheduledTime')">
                <div class="flex items-center gap-2">
                  <UInput v-model="state.scheduled_time" type="time" class="w-full" />
                  <UButton
                    v-if="state.scheduled_time"
                    type="button"
                    icon="i-mdi-close"
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    :aria-label="t('common.cancel')"
                    @click="state.scheduled_time = undefined"
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
                    <span class="pl-4 text-xs text-muted truncate">{{ state.red_corner_team || '—' }}</span>
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
                    <span class="pr-4 text-xs text-muted truncate">{{ state.blue_corner_team || '—' }}</span>
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
                      :variant="state.winner_id === null ? 'solid' : 'outline'"
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
                      :disabled="!state.red_corner_id"
                      @click="setWinner(state.red_corner_id)"
                    >
                      {{ t('match.redCorner') }}
                    </UButton>
                    <UButton
                      type="button"
                      size="sm"
                      class="flex-1"
                      :variant="isBlueWinner ? 'solid' : 'outline'"
                      color="info"
                      :disabled="!state.blue_corner_id"
                      @click="setWinner(state.blue_corner_id)"
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

                <UFormField name="end_method" :label="t('match.endMethod.label')">
                  <USelect v-model="state.end_method" :items="endMethodOptions" class="w-full" />
                </UFormField>
              </div>

              <UFormField name="end_round" :label="t('match.endRound')">
                <div class="flex items-center gap-2">
                  <UInput v-model="state.end_round" class="w-full" />
                  <UButton
                    v-if="state.end_round"
                    type="button"
                    icon="i-mdi-close"
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    :aria-label="t('common.cancel')"
                    @click="state.end_round = undefined"
                  />
                </div>
              </UFormField>

              <!-- Judges points table -->
              <MatchRecordJudgesPointsTable v-model="state.judges_points" :rounds="state.rounds" />
            </div>
          </template>
        </UTabs>

        <!-- Sticky footer -->
        <div class="flex justify-end gap-2 px-6 py-4 border-t border-default shrink-0">
          <UButton variant="ghost" color="neutral" type="button" @click="() => { open = false }">
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
import type { MatchRecord } from '~/types/models'
import type { JudgesPointsRow } from '~/types/models'
import * as z from 'zod'
import { type Gender, MATCH_STATUSES, type MatchStatus } from '~/utils/constants'

const props = defineProps<{
  item: MatchRecord | null
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
  tournament_id: null as string | null,
  red_corner_id: null as string | null,
  blue_corner_id: null as string | null,
  weight_category_id: null as string | null,
  discipline_id: null as string | null,
  red_corner_team: '',
  blue_corner_team: '',
  sort: 1 as number,
  scheduled_time: undefined as string | undefined,
  status: 'scheduled' as MatchStatus,
  winner_id: null as string | null,
  end_method: null as string | null,
  rounds: null as number | null,
  minutes_per_round: undefined as string | undefined,
  end_round: undefined as string | undefined,
  judges_points: [] as JudgesPointsRow[],
})

// ── Gender filter (mandatory, defaults to MALE) ───────────────────────────────
const genderFilter = ref<Gender>('male')

// ── Force entry (UI-only: bypasses athlete filters when true) ─────────────────
const forceEntry = ref(false)

// ── Filter state ────────────────────────────────────────────────────────────
const filtersLocked = computed(() => false)
const initializing = ref(false)

const filtersReady = computed(() =>
  !!state.tournament_id && !!state.discipline_id && !!state.weight_category_id,
)

const filterParams = computed(() => {
  const gender = genderFilter.value === 'hybrid' ? undefined : genderFilter.value
  return forceEntry.value
    ? { gender }
    : {
        tournament_id: state.tournament_id ?? undefined,
        discipline_id: state.discipline_id ?? undefined,
        weight_category_id: state.weight_category_id ?? undefined,
        validOnly: true as const,
        gender,
      }
})

// ── Status / end-method options ─────────────────────────────────────────────
const statusOptions = computed(() => [
  { label: t('match.status.scheduled'), value: 'scheduled' },
  { label: t('match.status.in_progress'), value: 'in_progress' },
  { label: t('match.status.completed'), value: 'completed' },
  { label: t('match.status.cancelled'), value: 'cancelled' },
])

const endMethodOptions = computed(() => [
  { label: t('match.noEndMethod'), value: null },
  { label: t('match.endMethod.victory_unanimous_decision'), value: 'victory_unanimous_decision' },
  { label: t('match.endMethod.victory_split_decision'), value: 'victory_split_decision' },
  { label: t('match.endMethod.victory_ko'), value: 'victory_ko' },
  { label: t('match.endMethod.victory_tko'), value: 'victory_tko' },
  { label: t('match.endMethod.victory_disqualification'), value: 'victory_disqualification' },
  { label: t('match.endMethod.draw'), value: 'draw' },
  { label: t('match.endMethod.no_contest'), value: 'no_contest' },
])

// ── Zod schemas ─────────────────────────────────────────────────────────────
const schema = z.object({
  tournament_id: z.string().min(1).nullable(),
  red_corner_id: z.string().min(1).nullable().optional(),
  blue_corner_id: z.string().min(1).nullable().optional(),
  weight_category_id: z.string().min(1).nullable().optional(),
  discipline_id: z.string().min(1).nullable().optional(),
  red_corner_team: z.string().optional(),
  blue_corner_team: z.string().optional(),
  sort: z.coerce.number().int().min(1),
  scheduled_time: z.string().optional().nullable(),
  status: z.enum(MATCH_STATUSES).optional(),
  winner_id: z.string().optional().nullable(),
  end_method: z.string().optional().nullable(),
  rounds: z.coerce.number().int().min(1).max(10),
  minutes_per_round: z.string().optional().nullable(),
  end_round: z.string().optional().nullable(),
  judges_points: z.any().optional().nullable(),
})

// ── Populate state when slideover opens ─────────────────────────────────────
const fetching = ref(false)

watch(open, async (val) => {
  if (!val) { return }
  initializing.value = true
  activeTab.value = props.initialTab ?? 'details'
  if (isEdit.value) {
    fetching.value = true
    try {
      const { data: item } = await api.get<{ data: MatchRecord }>(`/api/admin/match_records/${props.item!.id}`)
      forceEntry.value = item.forced ?? false
      genderFilter.value = item.gender ?? 'male'
      state.tournament_id = item.tournament_id ?? null
      state.red_corner_id = item.red_corner_id ?? null
      state.blue_corner_id = item.blue_corner_id ?? null
      state.weight_category_id = item.weight_category_id ?? null
      state.discipline_id = item.discipline_id ?? null
      state.red_corner_team = item.red_corner_team ?? ''
      state.blue_corner_team = item.blue_corner_team ?? ''
      state.sort = item.sort ?? 1
      state.scheduled_time = item.scheduled_time ?? undefined
      state.status = item.status ?? 'scheduled'
      state.winner_id = item.winner_id ?? null
      state.end_method = item.end_method ?? null
      state.judges_points = (item.judges_points as JudgesPointsRow[] | null) ?? []
      state.rounds = item.rounds ?? null
      state.minutes_per_round = item.minutes_per_round ?? undefined
      state.end_round = item.end_round ?? undefined
      syncJudgesPointsRows()
    } catch (e) {
      toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
      open.value = false
    } finally {
      fetching.value = false
    }
  } else {
    forceEntry.value = false
    genderFilter.value = 'male'
    state.tournament_id = null
    state.red_corner_id = null
    state.blue_corner_id = null
    state.weight_category_id = null
    state.discipline_id = null
    state.red_corner_team = ''
    state.blue_corner_team = ''
    state.sort = 1
    state.scheduled_time = undefined
    state.status = 'scheduled'
    state.winner_id = null
    state.end_method = null
    state.rounds = null
    state.minutes_per_round = undefined
    state.end_round = undefined
    state.judges_points = []
  }
  await nextTick()
  initializing.value = false
})

// ── When filters change (create mode), reset athlete selections ──────────────
watch(
  () => [state.tournament_id, state.discipline_id, state.weight_category_id],
  () => {
    if (initializing.value) { return }
    state.red_corner_id = null
    state.blue_corner_id = null
    state.winner_id = null
  },
)

// ── When gender filter changes, reset athlete selections ─────────────────────
watch(genderFilter, () => {
  if (initializing.value) { return }
  state.red_corner_id = null
  state.blue_corner_id = null
  state.winner_id = null
})

// ── When a corner athlete changes, reset winner if it was that athlete ────────
watch(() => state.red_corner_id, (val) => {
  if (state.winner_id !== null && state.winner_id !== val && state.winner_id !== state.blue_corner_id) {
    state.winner_id = null
  }
})
watch(() => state.blue_corner_id, (val) => {
  if (state.winner_id !== null && state.winner_id !== state.red_corner_id && state.winner_id !== val) {
    state.winner_id = null
  }
})

// ── Sync judges_points rows when rounds changes ───────────────────────────────
function syncJudgesPointsRows() {
  const val = state.rounds
  if (!val || val <= 0) { return }
  const n = Math.min(val, 10)
  const current = state.judges_points
  state.judges_points = Array.from({ length: n }, (_, i) => {
    const existing = current.find(r => r.round === i + 1)
    return existing ?? {
      round: i + 1,
      judge1_red: null,
      judge2_red: null,
      judge3_red: null,
      judge1_blue: null,
      judge2_blue: null,
      judge3_blue: null,
    }
  })
}

watch(() => state.rounds, () => {
  if (initializing.value) { return }
  syncJudgesPointsRows()
})

// ── Winner helpers ────────────────────────────────────────────────────────────
const winnerControlDisabled = computed(
  () => !state.red_corner_id && !state.blue_corner_id,
)

function setWinner(value: string | null) {
  state.winner_id = value
}

// ── Auto-fill rounds/minutes_per_round from selected discipline ───────────────
function onDisciplineSelect(item: Record<string, unknown>) {
  if (initializing.value) { return }
  state.rounds = item.rounds != null ? Number(item.rounds) : null
  state.minutes_per_round = item.minutes_per_round != null ? String(item.minutes_per_round) : undefined
}

// ── Auto-fill team from selected athlete object ───────────────────────────────
function onRedCornerSelect(item: Record<string, unknown>) {
  state.red_corner_team = String(item.team_name ?? '')
}

function onBlueCornerSelect(item: Record<string, unknown>) {
  state.blue_corner_team = String(item.team_name ?? '')
}

// ── Corner display labels (resolved from props.item in edit, placeholder in create) ──
const redCornerLabel = computed(() => {
  if (props.item?.red_corner?.full_name) { return props.item.red_corner.full_name }
  return state.red_corner_id ? `#${state.red_corner_id.slice(0, 6)}` : t('match.redCorner')
})
const blueCornerLabel = computed(() => {
  if (props.item?.blue_corner?.full_name) { return props.item.blue_corner.full_name }
  return state.blue_corner_id ? `#${state.blue_corner_id.slice(0, 6)}` : t('match.blueCorner')
})
const winnerLabel = computed(() => {
  if (!state.winner_id) { return null }
  if (state.winner_id === state.red_corner_id) { return redCornerLabel.value }
  if (state.winner_id === state.blue_corner_id) { return blueCornerLabel.value }
  return props.item?.winner?.full_name ?? t('match.winner')
})

const hasWinner = computed(() => !!state.winner_id)
const isRedWinner = computed(() => hasWinner.value && state.winner_id === state.red_corner_id)
const isBlueWinner = computed(() => hasWinner.value && state.winner_id === state.blue_corner_id)

// ── Submit ───────────────────────────────────────────────────────────────────
const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<z.infer<typeof schema>>) {
  loading.value = true
  try {
    const hasAnyPoints = state.judges_points.some(row =>
      row.judge1_red !== null || row.judge2_red !== null || row.judge3_red !== null
      || row.judge1_blue !== null || row.judge2_blue !== null || row.judge3_blue !== null,
    )
    const judges_points = hasAnyPoints ? state.judges_points : null

    const body = {
      tournament_id: event.data.tournament_id,
      red_corner_id: event.data.red_corner_id || null,
      blue_corner_id: event.data.blue_corner_id || null,
      weight_category_id: event.data.weight_category_id || null,
      discipline_id: event.data.discipline_id || null,
      red_corner_team: event.data.red_corner_team || null,
      blue_corner_team: event.data.blue_corner_team || null,
      sort: event.data.sort,
      scheduled_time: event.data.scheduled_time || null,
      status: event.data.status ?? 'scheduled',
      winner_id: event.data.winner_id || null,
      end_method: event.data.end_method || null,
      rounds: event.data.rounds,
      minutes_per_round: event.data.minutes_per_round,
      end_round: event.data.end_round || null,
      forced: forceEntry.value,
      gender: genderFilter.value,
      judges_points,
    }

    let saved: MatchRecord
    if (isEdit.value) {
      const { data } = await api.put<{ data: MatchRecord }>(`/api/admin/match_records/${props.item!.id}`, body)
      saved = data
    } else {
      const { data } = await api.post<{ data: MatchRecord }>('/api/admin/match_records', body)
      saved = data
    }

    initializing.value = true
    forceEntry.value = saved.forced ?? false
    genderFilter.value = saved.gender ?? 'male'
    state.tournament_id = saved.tournament_id ?? null
    state.red_corner_id = saved.red_corner_id ?? null
    state.blue_corner_id = saved.blue_corner_id ?? null
    state.weight_category_id = saved.weight_category_id ?? null
    state.discipline_id = saved.discipline_id ?? null
    state.red_corner_team = saved.red_corner_team ?? ''
    state.blue_corner_team = saved.blue_corner_team ?? ''
    state.sort = saved.sort ?? 1
    state.scheduled_time = saved.scheduled_time ?? undefined
    state.status = saved.status ?? 'scheduled'
    state.winner_id = saved.winner_id ?? null
    state.end_method = saved.end_method ?? null
    state.rounds = saved.rounds ?? null
    state.minutes_per_round = saved.minutes_per_round ?? undefined
    state.end_round = saved.end_round ?? undefined
    state.judges_points = (saved.judges_points as JudgesPointsRow[] | null) ?? []
    await nextTick()
    initializing.value = false

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
