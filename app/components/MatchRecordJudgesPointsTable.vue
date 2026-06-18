<template>
  <div>
    <p class="text-sm font-medium text-default mb-3 flex items-center gap-1.5">
      <UIcon name="i-mdi-clipboard-list-outline" class="size-4 text-muted" />
      {{ t('match.judgesPointsTable') }}
    </p>

    <div class="border border-default rounded-lg overflow-hidden">
      <table class="w-full text-xs">
        <thead>
          <!-- Corner group headers -->
          <tr class="bg-elevated border-b border-default">
            <th class="px-2 py-2 text-left font-medium text-muted w-10" rowspan="2">
              {{ t('match.roundLabel') }}
            </th>
            <th colspan="3" class="px-2 py-1.5 text-center font-semibold text-red-500 border-l border-default">
              <span class="flex items-center justify-center gap-1">
                <span class="size-2 rounded-full bg-red-500 inline-block" />
                {{ t('match.redCorner') }}
              </span>
            </th>
            <th colspan="3" class="px-2 py-1.5 text-center font-semibold text-blue-500 border-l border-default">
              <span class="flex items-center justify-center gap-1">
                <span class="size-2 rounded-full bg-blue-500 inline-block" />
                {{ t('match.blueCorner') }}
              </span>
            </th>
            <th v-if="showManualControls" rowspan="2" class="w-8 border-l border-default/30" />
          </tr>
          <!-- Judge sub-headers -->
          <tr class="bg-elevated/60 border-b border-default">
            <th class="px-1 py-1.5 text-center font-medium text-muted border-l border-default">
              {{ t('match.redCornerJudge1') }}
            </th>
            <th class="px-1 py-1.5 text-center font-medium text-muted border-l border-default/50">
              {{ t('match.redCornerJudge2') }}
            </th>
            <th class="px-1 py-1.5 text-center font-medium text-muted border-l border-default/50">
              {{ t('match.redCornerJudge3') }}
            </th>
            <th class="px-1 py-1.5 text-center font-medium text-muted border-l border-default">
              {{ t('match.blueCornerJudge1') }}
            </th>
            <th class="px-1 py-1.5 text-center font-medium text-muted border-l border-default/50">
              {{ t('match.blueCornerJudge2') }}
            </th>
            <th class="px-1 py-1.5 text-center font-medium text-muted border-l border-default/50">
              {{ t('match.blueCornerJudge3') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- Skeleton row when no rows yet -->
          <tr v-if="modelValue.length === 0">
            <td class="px-2 py-2 text-center text-muted font-medium">
              —
            </td>
            <td v-for="n in 6" :key="n" class="px-1 py-2 border-l border-default/30">
              <div class="h-6 rounded bg-muted/20 animate-pulse" />
            </td>
            <td v-if="showManualControls" class="border-l border-default/30" />
          </tr>
          <!-- Data rows -->
          <tr
            v-for="(row, index) in modelValue"
            :key="row.round"
            class="border-t border-default/40 hover:bg-elevated/30 transition-colors"
          >
            <td class="px-2 py-1.5 text-center font-semibold text-muted">
              {{ row.round }}
            </td>
            <!-- Red corner cells -->
            <td class="px-1 py-1.5 border-l border-default">
              <span v-if="readonly" class="block text-center">{{ row.judge1_red ?? '—' }}</span>
              <UInput
                v-else
                v-model="row.judge1_red"
                type="number"
                size="xs"
                class="w-full text-center"
              />
            </td>
            <td class="px-1 py-1.5 border-l border-default/50">
              <span v-if="readonly" class="block text-center">{{ row.judge2_red ?? '—' }}</span>
              <UInput
                v-else
                v-model="row.judge2_red"
                type="number"
                size="xs"
                class="w-full text-center"
              />
            </td>
            <td class="px-1 py-1.5 border-l border-default/50">
              <span v-if="readonly" class="block text-center">{{ row.judge3_red ?? '—' }}</span>
              <UInput
                v-else
                v-model="row.judge3_red"
                type="number"
                size="xs"
                class="w-full text-center"
              />
            </td>
            <!-- Blue corner cells -->
            <td class="px-1 py-1.5 border-l border-default">
              <span v-if="readonly" class="block text-center">{{ row.judge1_blue ?? '—' }}</span>
              <UInput
                v-else
                v-model="row.judge1_blue"
                type="number"
                size="xs"
                class="w-full text-center"
              />
            </td>
            <td class="px-1 py-1.5 border-l border-default/50">
              <span v-if="readonly" class="block text-center">{{ row.judge2_blue ?? '—' }}</span>
              <UInput
                v-else
                v-model="row.judge2_blue"
                type="number"
                size="xs"
                class="w-full text-center"
              />
            </td>
            <td class="px-1 py-1.5 border-l border-default/50">
              <span v-if="readonly" class="block text-center">{{ row.judge3_blue ?? '—' }}</span>
              <UInput
                v-else
                v-model="row.judge3_blue"
                type="number"
                size="xs"
                class="w-full text-center"
              />
            </td>
            <!-- Remove button (manual mode only) -->
            <td v-if="showManualControls" class="px-1 py-1.5 border-l border-default/30 text-center">
              <UButton
                type="button"
                icon="i-mdi-close"
                variant="ghost"
                color="neutral"
                size="xs"
                :aria-label="t('common.delete')"
                @click="removeRow(index)"
              />
            </td>
          </tr>
        </tbody>
        <!-- Totals row -->
        <tfoot v-if="modelValue.length > 0">
          <tr class="border-t-2 border-default bg-elevated/40 font-semibold">
            <td class="px-2 py-1.5 text-center text-muted text-xs">
              {{ t('match.total') }}
            </td>
            <td class="px-1 py-1.5 text-center border-l border-default text-xs">
              {{ totals.judge1_red ?? '—' }}
            </td>
            <td class="px-1 py-1.5 text-center border-l border-default/50 text-xs">
              {{ totals.judge2_red ?? '—' }}
            </td>
            <td class="px-1 py-1.5 text-center border-l border-default/50 text-xs">
              {{ totals.judge3_red ?? '—' }}
            </td>
            <td class="px-1 py-1.5 text-center border-l border-default text-xs">
              {{ totals.judge1_blue ?? '—' }}
            </td>
            <td class="px-1 py-1.5 text-center border-l border-default/50 text-xs">
              {{ totals.judge2_blue ?? '—' }}
            </td>
            <td class="px-1 py-1.5 text-center border-l border-default/50 text-xs">
              {{ totals.judge3_blue ?? '—' }}
            </td>
            <td v-if="showManualControls" class="border-l border-default/30" />
          </tr>
        </tfoot>
      </table>

      <!-- Footer -->
      <div class="px-3 py-2 border-t border-default/40 flex items-center justify-between gap-2">
        <span v-if="modelValue.length === 0 && !readonly" class="text-xs text-muted italic">
          {{ t('match.roundsHint') }}
        </span>
        <span v-else class="text-xs text-muted">
          {{ modelValue.length }} {{ t('match.roundLabel').toLowerCase() }}
        </span>
        <UButton
          v-if="showManualControls"
          type="button"
          icon="i-mdi-plus"
          variant="ghost"
          color="neutral"
          size="xs"
          @click="addRow"
        >
          {{ t('match.addRound') }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JudgesPointsRow } from '~/types/models'

const props = defineProps<{
  modelValue: JudgesPointsRow[]
  readonly?: boolean
  rounds?: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: JudgesPointsRow[]]
}>()

const { t } = useI18n()

const showManualControls = computed(() => !props.readonly && (props.rounds === null || props.rounds === undefined))

const totals = computed(() => {
  const cols = ['judge1_red', 'judge2_red', 'judge3_red', 'judge1_blue', 'judge2_blue', 'judge3_blue'] as const
  return Object.fromEntries(cols.map((col) => {
    const vals = props.modelValue.map(r => r[col]).filter(v => v !== null) as number[]
    return [col, vals.length ? vals.reduce((a, b) => a + b, 0) : null]
  })) as Record<typeof cols[number], number | null>
})

function addRow() {
  const rows = props.modelValue
  const nextRound = rows.length > 0 ? rows[rows.length - 1]!.round + 1 : 1
  emit('update:modelValue', [
    ...rows,
    {
      round: nextRound,
      judge1_red: null,
      judge2_red: null,
      judge3_red: null,
      judge1_blue: null,
      judge2_blue: null,
      judge3_blue: null,
    },
  ])
}

function removeRow(index: number) {
  const rows = props.modelValue.filter((_, i) => i !== index).map((row, i) => ({ ...row, round: i + 1 }))
  emit('update:modelValue', rows)
}
</script>
