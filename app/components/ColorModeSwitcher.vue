<template>
  <div v-if="!collapsed" class="flex items-center gap-0.5 px-1">
    <div class="flex items-center gap-1 mr-1.5">
      <button
        v-for="c in palette"
        :key="c.name"
        type="button"
        class="size-3 rounded-full shrink-0 transition-transform hover:scale-125 focus-visible:outline-none"
        :class="[
          c.bgClass,
          currentPrimary === c.name ? 'ring-1 ring-offset-1 scale-110' : '',
        ]"
        :aria-label="c.name"
        @click="setColor(c.name)"
      />
    </div>
    <span class="text-dimmed text-xs select-none">·</span>
    <UButton
      size="xs"
      variant="ghost"
      color="neutral"
      icon="i-mdi-weather-sunny"
      :class="!isDark ? 'text-highlighted font-semibold' : 'text-dimmed'"
      @click="() => { colorMode.preference = 'light' }"
    />
    <span class="text-dimmed text-xs select-none">·</span>
    <UButton
      size="xs"
      variant="ghost"
      color="neutral"
      icon="i-mdi-weather-night"
      :class="isDark ? 'text-highlighted font-semibold' : 'text-dimmed'"
      @click="() => { colorMode.preference = 'dark' }"
    />
  </div>

  <div v-else class="flex flex-col items-center gap-1">
    <UPopover>
      <button
        type="button"
        class="size-5 rounded-full mx-auto focus-visible:outline-none ring-1 ring-offset-1 ring-default"
        :class="[
          currentEntry?.bgClass ?? '',
        ]"
      />
      <template #content>
        <div class="grid grid-cols-4 gap-1.5 p-2">
          <button
            v-for="c in palette"
            :key="c.name"
            type="button"
            class="size-4 rounded-full transition-transform hover:scale-125 focus-visible:outline-none"
            :class="[
              c.bgClass,
              currentPrimary === c.name ? 'ring-1 ring-offset-1 scale-110' : '',
            ]"
            :aria-label="c.name"
            @click="setColor(c.name)"
          />
        </div>
      </template>
    </UPopover>
    <UColorModeButton size="xs" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ collapsed?: boolean }>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const { palette, currentPrimary, setColor } = useColorPreference()
const currentEntry = computed(() => palette.find(c => c.name === currentPrimary.value))
</script>
