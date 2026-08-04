<template>
  <UApp :locale="locales[locale]" :toaster="{ position: 'top-right' }">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
import * as locales from '@nuxt/ui/locale'

// Senza questo i messaggi interni di @nuxt/ui restano in inglese.
const { locale } = useI18n()
</script>
