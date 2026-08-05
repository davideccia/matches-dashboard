<template>
  <iframe
    :srcdoc="architectureHtml"
    title="Architecture map"
    class="fixed inset-0 h-full w-full border-0"
  />
</template>

<script setup lang="ts">
// La mappa vive in docs/architecture.html (deliverable rigenerabile): importarla
// raw evita una seconda copia. L'iframe la isola da Tailwind e da @nuxt/ui.
import architectureHtml from '~~/docs/architecture.html?raw'

// La rotta è rimossa dal build di produzione (vedi nuxt.config.ts), quindi qui
// basta togliere layout e autenticazione: in dev è consultabile da chiunque.
definePageMeta({
  layout: false,
  sanctum: { excluded: true },
})
</script>
