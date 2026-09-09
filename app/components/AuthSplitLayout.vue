<template>
  <div
    class="fixed inset-0 flex flex-col lg:items-center lg:justify-center bg-default"
  >
    <!-- Mobile top strip -->
    <div
      class="h-35 w-full shrink-0 bg-default flex items-center justify-center lg:hidden relative overflow-hidden rounded-b-10"
    >
      <div class="absolute inset-0 opacity-10">
        <div
          class="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-white/30"
        />
        <div
          class="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-white/20"
        />
      </div>
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
        <div class="absolute inset-0">
          <div
            class="absolute -top-12 -left-12 w-56 h-56 rounded-full bg-white/10"
          />
          <div
            class="absolute top-1/3 -right-16 w-48 h-48 rounded-full bg-white/8"
          />
          <div
            class="absolute -bottom-16 left-1/4 w-64 h-64 rounded-full bg-white/6"
          />
        </div>
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
        class="flex flex-col w-full lg:w-[45%] h-full bg-elevated relative overflow-x-hidden overflow-y-auto px-10 pt-8 pb-6 lg:px-16 lg:pt-25 lg:pb-10"
      >
        <div class="absolute inset-0 pointer-events-none">
          <div
            class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/6"
          />
          <div
            class="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/8"
          />
        </div>

        <div class="relative z-10 flex flex-col grow justify-center">
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
