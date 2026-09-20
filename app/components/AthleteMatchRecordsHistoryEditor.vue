<template>
  <div class="flex flex-col gap-2">
    <div class="border border-default rounded-lg overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-elevated border-b border-default">
            <th class="px-3 py-2 text-left font-medium text-muted">
              {{ t('athlete.matchRecordsHistoryDiscipline') }}
            </th>
            <th class="px-3 py-2 text-left font-medium text-muted w-32">
              {{ t('athlete.matchRecordsHistoryManualTotal') }}
            </th>
            <th class="px-3 py-2 text-left font-medium text-muted w-28">
              {{ t('athlete.matchRecordsHistoryAppTotal') }}
            </th>
            <th class="px-3 py-2 text-left font-medium text-muted w-24">
              {{ t('athlete.matchRecordsHistoryTotal') }}
            </th>
            <th class="w-10" />
          </tr>
        </thead>
        <tbody>
          <tr v-if="rows.length === 0">
            <td colspan="5" class="px-3 py-8 text-center text-sm italic text-muted">
              {{ t('athlete.matchRecordsHistoryEmpty') }}
            </td>
          </tr>
          <tr
            v-for="(row, index) in rows"
            :key="index"
            class="border-t border-default/60"
          >
            <td class="px-3 py-2 align-top">
              <UFormField :name="`${fieldName}.${index}.label`">
                <div class="flex items-center gap-2">
                  <ApiSelectMenu
                    v-if="!row.useManualLabel"
                    :model-value="row.id"
                    endpoint="/api/admin/disciplines"
                    label-key="label"
                    :placeholder="t('athlete.matchRecordsHistorySelectDiscipline')"
                    class="w-full"
                    @update:model-value="(v: string | null) => setRowDisciplineId(index, v)"
                    @select="(item: Record<string, unknown>) => setRowDiscipline(index, item)"
                  />
                  <UInput
                    v-else
                    v-model="row.label"
                    size="sm"
                    class="w-full"
                    :placeholder="t('athlete.matchRecordsHistoryManualLabel')"
                  />
                  <UButton
                    type="button"
                    :icon="row.useManualLabel ? 'i-mdi-format-list-bulleted' : 'i-mdi-pencil-outline'"
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    :aria-label="t('athlete.matchRecordsHistoryUseManualLabel')"
                    @click="() => switchRowToManual(index, !row.useManualLabel)"
                  />
                </div>
              </UFormField>
            </td>
            <td class="px-3 py-2 align-top">
              <UFormField :name="`${fieldName}.${index}.manual_total`">
                <UInputNumber v-model="row.manual_total" :min="0" size="sm" class="w-full" />
              </UFormField>
            </td>
            <td class="px-3 py-2 align-top tabular-nums text-muted">
              {{ row.app_total }}
            </td>
            <td class="px-3 py-2 align-top tabular-nums text-muted">
              {{ row.manual_total + row.app_total }}
            </td>
            <td class="px-3 py-2 align-top text-right">
              <UButton
                type="button"
                icon="i-mdi-close"
                variant="ghost"
                color="neutral"
                size="xs"
                :aria-label="t('athlete.matchRecordsHistoryRemoveRow')"
                @click="removeRow(index)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <UButton
      type="button"
      icon="i-mdi-plus"
      variant="subtle"
      color="neutral"
      size="sm"
      class="self-start"
      @click="addRow"
    >
      {{ t('athlete.matchRecordsHistoryAddRow') }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
import type { HistoryRow } from '~/utils/athleteMatchRecordsHistory'

withDefaults(defineProps<{
  fieldName?: string
}>(), {
  fieldName: 'match_records_history_rows',
})

const rows = defineModel<HistoryRow[]>({ required: true })
const { t } = useI18n()

function addRow() {
  rows.value = [...rows.value, blankHistoryRow()]
}

function removeRow(index: number) {
  rows.value = rows.value.filter((_, i) => i !== index)
}

function setRowDisciplineId(index: number, value: string | null) {
  const row = rows.value[index]
  if (row) { row.id = value }
}

function setRowDiscipline(index: number, item: Record<string, unknown>) {
  const row = rows.value[index]
  if (row) { row.label = String(item.label ?? '') }
}

function switchRowToManual(index: number, manual: boolean) {
  const row = rows.value[index]
  if (!row) { return }
  row.useManualLabel = manual
  if (manual) { row.id = null }
}
</script>
