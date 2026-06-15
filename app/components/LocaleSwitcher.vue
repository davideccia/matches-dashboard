<template>
  <div v-if="!collapsed" class="flex items-center gap-0.5 px-1">
    <UButton
      size="xs"
      variant="ghost"
      color="neutral"
      :class="locale === 'it' ? 'text-highlighted font-semibold' : 'text-dimmed'"
      @click="setLocale('it')"
    >
      🇮🇹 IT
    </UButton>
    <span class="text-dimmed text-xs select-none">·</span>
    <UButton
      size="xs"
      variant="ghost"
      color="neutral"
      :class="locale === 'en' ? 'text-highlighted font-semibold' : 'text-dimmed'"
      @click="setLocale('en')"
    >
      🇬🇧 EN
    </UButton>
  </div>
  <UButton
    v-else
    variant="ghost"
    color="neutral"
    size="xs"
    icon="i-mdi-web"
    class="mx-auto"
    @click="setLocale(locale === 'it' ? 'en' : 'it')"
  />
</template>

<script setup lang="ts">
defineProps<{ collapsed?: boolean }>()
const { locale, setLocale } = useI18n()
</script>
