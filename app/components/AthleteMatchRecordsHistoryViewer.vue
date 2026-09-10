<template>
  <UModal v-model:open="open" :title="item?.full_name ?? t('athlete.matchRecordsHistory')">
    <template #body>
      <div v-if="item" class="flex flex-wrap items-center gap-2 mb-4">
        <UBadge color="primary" variant="subtle" icon="i-mdi-cake-variant-outline">
          {{ formatServerDateOnly(item.birth_date, locale) }} ({{ item.age }})
        </UBadge>
        <UBadge :color="item.gender === 'male' ? 'info' : 'neutral'" variant="subtle">
          {{ item.gender === 'male' ? t('athlete.gender.male') : t('athlete.gender.female') }}
        </UBadge>
        <UBadge v-if="item.team_name" color="neutral" variant="subtle" icon="i-mdi-account-group-outline">
          {{ item.team_name }}
        </UBadge>
      </div>

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
            </tr>
          </thead>
          <tbody>
            <tr v-if="disciplines.length === 0">
              <td colspan="4" class="px-3 py-8 text-center text-sm italic text-muted">
                {{ t('athlete.matchRecordsHistoryEmpty') }}
              </td>
            </tr>
            <tr
              v-for="(discipline, index) in disciplines"
              :key="discipline.id ?? index"
              class="border-t border-default/60"
            >
              <td class="px-3 py-2 align-top">
                {{ discipline.label }}
              </td>
              <td class="px-3 py-2 align-top tabular-nums text-muted">
                {{ discipline.manual_total }}
              </td>
              <td class="px-3 py-2 align-top tabular-nums text-muted">
                {{ discipline.id === null ? '' : discipline.app_total }}
              </td>
              <td class="px-3 py-2 align-top tabular-nums text-muted">
                {{ discipline.total }}
              </td>
            </tr>
          </tbody>
          <tfoot v-if="disciplines.length > 0">
            <tr class="border-t border-default font-medium">
              <td class="px-3 py-2" colspan="3">
                {{ t('athlete.matchRecordsHistoryTotal') }}
              </td>
              <td class="px-3 py-2 tabular-nums">
                {{ item?.match_records_history?.total ?? 0 }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Athlete } from '~/types/models'

const props = defineProps<{
  item: Athlete | null
}>()

const open = defineModel<boolean>('open', { required: true })
const { t, locale } = useI18n()

const disciplines = computed(() => props.item?.match_records_history?.disciplines ?? [])
</script>
