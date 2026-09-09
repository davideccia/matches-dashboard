<template>
  <div
    class="fixed inset-0 flex flex-col lg:items-center lg:justify-center bg-default"
  >
    <!-- Mobile top strip -->
    <div
      class="h-35 w-full shrink-0 bg-default flex items-center justify-center lg:hidden relative overflow-hidden rounded-b-10"
    >
      <AppLogo
        :unlockable="logoUnlockable"
        :variant="logoVariant"
        size="size-20"
        icon-class="drop-shadow-lg"
        root-class="relative z-10"
      />
    </div>

    <!-- Split: full-bleed on desktop, grows full height on mobile -->
    <div
      class="flex flex-col lg:flex-row w-full grow overflow-hidden"
    >
      <!-- Left panel: visible only on desktop -->
      <div
        class="hidden lg:flex lg:w-[55%] h-full bg-default items-center justify-center relative overflow-hidden"
      >
        <AppLogo
          :unlockable="logoUnlockable"
          :variant="logoVariant"
          size="size-48"
          icon-class="drop-shadow-2xl"
          root-class="relative z-10"
        />
      </div>

      <!-- Right panel: form -->
      <div
        class="flex flex-col w-full lg:w-[45%] h-full bg-elevated overflow-x-hidden overflow-y-auto px-10 pt-8 pb-6 lg:px-16 lg:pt-25 lg:pb-10"
      >
        <div class="flex flex-col grow justify-center">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  logoVariant?: 'boxed' | 'bare'
  logoUnlockable?: boolean
}>(), {
  logoVariant: 'boxed',
  logoUnlockable: false,
})
</script>
