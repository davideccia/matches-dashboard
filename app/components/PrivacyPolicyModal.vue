<template>
  <UModal v-model:open="open" :title="t('common.privacyPolicy')" :ui="{ body: 'p-0' }">
    <template #body>
      <div class="max-h-[60vh] overflow-y-auto px-6 py-5 text-sm text-default whitespace-pre-wrap leading-relaxed">
        {{ privacyPolicyText }}
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end px-6 py-4">
        <UButton @click="() => { open = false }">
          {{ t('common.close') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const open = defineModel<boolean>({ default: false })
const { t, locale } = useI18n()

const privacyPolicyText = ref('')
const loadedLocale = ref<string | null>(null)

watch(open, async (isOpen) => {
  if (isOpen && loadedLocale.value !== locale.value) {
    const path = locale.value === 'en' ? '/privacy.en.txt' : '/privacy.txt'
    privacyPolicyText.value = await $fetch<string>(path, { responseType: 'text' })
    loadedLocale.value = locale.value
  }
})
</script>
