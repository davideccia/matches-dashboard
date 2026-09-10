<template>
  <ApiSelectMenu
    :model-value="modelValue"
    endpoint="/api/admin/athletes"
    label-key="full_name"
    :placeholder="placeholder"
    :disabled="disabled"
    :query-params="queryParams"
    class="w-full"
    @update:model-value="$emit('update:modelValue', $event)"
    @select="$emit('select', $event)"
  >
    <template #label="{ item: slotItem }">
      <span class="flex items-center gap-2 min-w-0 w-full">
        <span class="truncate flex-1">{{ slotItem.full_name }}</span>
        <UBadge
          v-if="slotItem.age !== undefined"
          color="primary"
          variant="subtle"
          size="md"
          icon="i-mdi-cake-variant-outline"
        >{{ slotItem.age }}</UBadge>
        <span
          class="inline-flex items-center gap-1 shrink-0 rounded-full border border-muted bg-elevated px-1.5 py-px text-[11px] font-medium text-muted"
        >
          <UIcon name="i-mdi-boxing-glove" size="md" class="size-4 opacity-70 bg-amber-400" />
          {{ matchRecordsCount(slotItem) }}
        </span>
      </span>
    </template>
  </ApiSelectMenu>
</template>

<script setup lang="ts">
import type { Athlete } from '~/types/models'

const props = withDefaults(defineProps<{
  modelValue: string | null
  placeholder?: string
  disabled?: boolean
  queryParams?: Record<string, string | number | boolean | undefined>
  disciplineId?: string | null
}>(), {
  placeholder: undefined,
  disabled: false,
  queryParams: undefined,
  disciplineId: null,
})

defineEmits<{
  'update:modelValue': [value: string | null]
  'select': [item: Record<string, unknown>]
}>()

function matchRecordsCount(item: Record<string, unknown>): number {
  const history = item.match_records_history as Athlete['match_records_history']
  if (props.disciplineId != null) {
    return history?.disciplines.find(d => d.id === props.disciplineId)?.total ?? 0
  }
  return history?.total ?? 0
}
</script>
