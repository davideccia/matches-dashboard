<template>
  <div class="inline-flex items-center gap-1 rounded-full border border-default bg-elevated p-1">
    <button
      type="button"
      class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
      :class="mode === 'window' ? 'bg-primary text-inverted' : 'text-dimmed hover:text-muted'"
      @click="mode = 'window'"
    >
      <UIcon name="i-mdi-view-carousel-outline" class="size-3.5" />
      {{ t('publicMatchRecords.viewWindow') }}
    </button>
    <button
      type="button"
      class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
      :class="mode === 'grid' ? 'bg-primary text-inverted' : 'text-dimmed hover:text-muted'"
      @click="mode = 'grid'"
    >
      <UIcon name="i-mdi-view-grid-outline" class="size-3.5" />
      {{ t('publicMatchRecords.viewGrid') }}
    </button>
  </div>
</template>

<script setup lang="ts">
const mode = defineModel<'grid' | 'window'>({ required: true })
const { t } = useI18n()
</script>
