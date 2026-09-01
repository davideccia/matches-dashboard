<template>
  <UButton
    size="xs"
    variant="subtle"
    :color="enabled ? 'success' : 'neutral'"
    class="rounded-full"
    :aria-label="t('publicMatchRecords.toggleRealtime')"
    :title="t('publicMatchRecords.toggleRealtime')"
    @click="enabled = !enabled"
  >
    <span v-if="enabled" class="size-1.5 rounded-full bg-current animate-pulse inline-block" />
    {{ enabled ? t('publicMatchRecords.liveIndicator') : t('publicMatchRecords.liveIndicatorOff') }}
  </UButton>
</template>

<script setup lang="ts">
const enabled = defineModel<boolean>({ required: true })
const { t } = useI18n()
</script>
