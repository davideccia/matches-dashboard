<template>
  <footer class="shrink-0 h-10 flex items-center justify-end px-4 bg-default border-t border-default">
    <UButton
      variant="link"
      color="neutral"
      size="sm"
      @click="showPrivacyModal = true"
    >
      {{ t('common.privacyPolicy') }}
    </UButton>
    <PrivacyPolicyModal v-model="showPrivacyModal" />
  </footer>
</template>

<script setup lang="ts">
const { t } = useI18n()
const showPrivacyModal = ref(false)
</script>
