<template>
  <UDashboardPanel>
    <UDashboardNavbar :title="t('nav.settings')" />

    <div class="p-6 max-w-2xl flex flex-col gap-6">
      <!-- Colore interfaccia -->
      <div class="flex flex-col gap-3">
        <div>
          <p class="text-sm font-semibold text-highlighted">
            {{ t('settings.appearance') }}
          </p>
          <p class="text-xs text-muted">
            {{ t('settings.appearanceDesc') }}
          </p>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          <button
            v-for="c in palette"
            :key="c.name"
            type="button"
            class="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs capitalize transition-colors focus-visible:outline-none"
            :class="currentPrimary === c.name
              ? 'border-primary bg-primary/10 text-highlighted font-semibold'
              : 'border-default text-muted hover:bg-elevated'"
            @click="setColor(c.name)"
          >
            <span class="size-3 rounded-full shrink-0" :class="c.bgClass" />
            {{ c.name }}
          </button>
        </div>
      </div>

      <USeparator />

      <!-- Modalità chiaro/scuro -->
      <div class="flex flex-col gap-3">
        <div>
          <p class="text-sm font-semibold text-highlighted">
            {{ t('settings.colorMode') }}
          </p>
          <p class="text-xs text-muted">
            {{ t('settings.colorModeDesc') }}
          </p>
        </div>
        <div class="flex gap-2">
          <UButton
            v-for="mode in colorModes"
            :key="mode.value"
            :icon="mode.icon"
            :label="mode.label"
            :variant="colorMode.preference === mode.value ? 'solid' : 'outline'"
            color="neutral"
            size="sm"
            @click="() => { colorMode.preference = mode.value }"
          />
        </div>
      </div>

      <USeparator />

      <!-- Lingua -->
      <div class="flex flex-col gap-3">
        <div>
          <p class="text-sm font-semibold text-highlighted">
            {{ t('settings.language') }}
          </p>
          <p class="text-xs text-muted">
            {{ t('settings.languageDesc') }}
          </p>
        </div>
        <div class="flex gap-2">
          <UButton
            v-for="loc in locales"
            :key="loc.code"
            :label="loc.name"
            :variant="locale === loc.code ? 'solid' : 'outline'"
            color="neutral"
            size="sm"
            @click="setLocale(loc.code)"
          />
        </div>
      </div>
    </div>
  </UDashboardPanel>
</template>

<script setup lang="ts">
const { t, locale, locales, setLocale } = useI18n()
const colorMode = useColorMode()
const { palette, currentPrimary, setColor } = useColorPreference()

const colorModes = computed(() => [
  { value: 'light', icon: 'i-mdi-weather-sunny', label: t('settings.light') },
  { value: 'system', icon: 'i-mdi-monitor', label: t('settings.system') },
  { value: 'dark', icon: 'i-mdi-weather-night', label: t('settings.dark') },
])
</script>
