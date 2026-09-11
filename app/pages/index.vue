<template>
  <div class="min-h-screen bg-default flex flex-col items-center justify-center px-4 py-8 gap-8">
    <div class="flex items-center gap-2">
      <LocaleSwitcher />
      <ColorModeToggle />
    </div>

    <div class="flex flex-col items-center gap-3 text-center">
      <AppLogo
        variant="boxed"
        size="size-40"
        icon-class="drop-shadow-lg"
      />
    </div>

    <div class="w-full max-w-3xl space-y-6">
      <!-- Gruppo 1: Amministrazione -->
      <div class="rounded-2xl bg-elevated border border-default p-6 space-y-4">
        <h2 class="text-center font-semibold text-default">
          {{ t('landing.adminGroupTitle') }}
        </h2>

        <button
          type="button"
          class="w-full flex items-center gap-4 rounded-2xl bg-default border border-default p-6 hover:border-primary transition-colors text-left cursor-pointer"
          @click="navigateTo('/login')"
        >
          <div class="size-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center">
            <UIcon name="i-mdi-shield-account" class="size-6 text-primary" />
          </div>
          <div class="min-w-0">
            <p class="font-semibold text-default">
              {{ t('landing.adminTitle') }}
            </p>
            <p class="text-sm text-muted">
              {{ t('landing.adminDescription') }}
            </p>
          </div>
          <UIcon name="i-mdi-chevron-right" class="size-5 text-muted ml-auto shrink-0" />
        </button>
      </div>

      <div class="flex items-center gap-3">
        <USeparator />
        <span class="text-xs text-muted uppercase shrink-0">•</span>
        <USeparator />
      </div>

      <!-- Gruppo 2: Accesso al pubblico -->
      <div class="rounded-2xl bg-elevated border border-default p-6 space-y-4">
        <h2 class="text-center font-semibold text-default">
          {{ t('landing.publicGroupTitle') }}
        </h2>

        <div class="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            class="flex-1 flex flex-col items-center gap-3 rounded-2xl bg-default border border-default p-6 hover:border-primary transition-colors text-center cursor-pointer"
            @click="navigateTo('/public/athletes/registration')"
          >
            <div class="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <UIcon name="i-mdi-account-plus" class="size-6 text-primary" />
            </div>
            <div>
              <p class="font-semibold text-default">
                {{ t('landing.registerTitle') }}
              </p>
              <p class="text-sm text-muted">
                {{ t('landing.registerDescription') }}
              </p>
            </div>
          </button>

          <button
            type="button"
            class="flex-1 flex flex-col items-center gap-3 rounded-2xl bg-default border border-default p-6 hover:border-primary transition-colors text-center cursor-pointer"
            @click="navigateTo('/public/tournaments/match_records')"
          >
            <div class="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <UIcon name="i-mdi-sword-cross" class="size-6 text-primary" />
            </div>
            <div>
              <p class="font-semibold text-default">
                {{ t('landing.tournamentsTitle') }}
              </p>
              <p class="text-sm text-muted">
                {{ t('landing.tournamentsDescription') }}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  sanctum: { guestOnly: true },
})

const { t } = useI18n()
</script>
