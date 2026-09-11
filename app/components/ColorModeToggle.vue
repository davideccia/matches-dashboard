<template>
  <UButton
    size="xs"
    variant="ghost"
    color="neutral"
    :icon="current.icon"
    :aria-label="current.label"
    :title="current.label"
    @click="cycle"
  />
</template>

<script setup lang="ts">
const { t } = useI18n()
const colorMode = useColorMode()

const MODES = ['light', 'dark', 'system'] as const

const ICONS: Record<typeof MODES[number], string> = {
  light: 'i-mdi-weather-sunny',
  dark: 'i-mdi-weather-night',
  system: 'i-mdi-monitor',
}

const current = computed(() => {
  const mode = colorMode.preference as typeof MODES[number]
  const labels: Record<typeof MODES[number], string> = {
    light: t('settings.light'),
    dark: t('settings.dark'),
    system: t('settings.system'),
  }
  return { icon: ICONS[mode] ?? ICONS.system, label: labels[mode] ?? labels.system }
})

function cycle() {
  const currentIndex = MODES.indexOf(colorMode.preference as typeof MODES[number])
  colorMode.preference = MODES[(currentIndex + 1) % MODES.length]
}
</script>
