<template>
  <div class="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-default px-4 py-6 text-center text-muted">
    <span class="text-xs font-bold uppercase tracking-widest text-dimmed">{{ label }}</span>
    <UIcon name="i-mdi-sword-cross" class="size-6 opacity-30" />
    <span class="text-xs">{{ hint }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  hint: string
}>()
</script>
