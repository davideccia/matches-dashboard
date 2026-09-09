<template>
  <AuthSplitLayout logo-variant="bare">
    <!-- Success state -->
    <div
      v-if="sent"
      class="flex flex-col gap-6"
    >
      <UAlert
        color="success"
        variant="soft"
        :title="t('forgotPassword.successTitle')"
        :description="t('forgotPassword.successDescription')"
        icon="i-mdi-email-check-outline"
      />
      <UButton
        :label="t('forgotPassword.backToLogin')"
        icon="i-mdi-arrow-left"
        block
        variant="ghost"
        @click="() => { navigateTo('/login') }"
      />
    </div>

    <!-- Form state -->
    <UAuthForm
      v-else
      :schema="schema"
      :fields="fields"
      :title="t('forgotPassword.title')"
      :description="t('forgotPassword.description')"
      :submit="{ label: t('forgotPassword.submit'), loading }"
      @submit="onSubmit"
    >
      <template v-if="errorMsg" #validation>
        <UAlert
          color="error"
          variant="soft"
          :title="errorMsg"
          icon="i-mdi-alert-circle"
        />
      </template>
      <template #footer>
        <USeparator class="mb-4" />
        <UButton
          :label="t('forgotPassword.backToLogin')"
          icon="i-mdi-arrow-left"
          block
          variant="ghost"
          @click="() => { navigateTo('/login') }"
        />
      </template>
    </UAuthForm>
  </AuthSplitLayout>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'

definePageMeta({
  layout: false,
  sanctum: { guestOnly: true },
})

const { t } = useI18n()
const { post } = useApi()

const sent = ref(false)
const loading = ref(false)
const errorMsg = ref<string | null>(null)

const schema = z.object({
  email: z.email(t('forgotPassword.email')),
})

type Schema = z.output<typeof schema>

const fields = computed(() => [
  {
    name: 'email',
    type: 'email' as const,
    label: t('forgotPassword.email'),
    placeholder: 'email@esempio.com',
    required: true,
  },
])

function extractErrorMessage(e: unknown): string | null {
  if (e && typeof e === 'object' && 'data' in e) {
    const data = (e as { data?: { message?: string, errors?: Record<string, string[]> } }).data
    if (data?.errors) {
      return Object.values(data.errors).flat().join(' ')
    }
    return data?.message ?? null
  }
  return null
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  errorMsg.value = null
  loading.value = true
  try {
    await post('/api/admin/auth/forgot_password', { email: event.data.email })
    sent.value = true
  } catch (e) {
    errorMsg.value = extractErrorMessage(e) ?? t('forgotPassword.errorRequest')
  } finally {
    loading.value = false
  }
}
</script>
