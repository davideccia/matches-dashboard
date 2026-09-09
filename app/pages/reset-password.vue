<template>
  <AuthSplitLayout logo-variant="bare">
    <!-- Invalid link state -->
    <div
      v-if="!token || !email"
      class="flex flex-col gap-6"
    >
      <UAlert
        color="error"
        variant="soft"
        :title="t('resetPassword.invalidLink')"
        icon="i-mdi-alert-circle"
      />
      <UButton
        :label="t('resetPassword.requestNewLink')"
        icon="i-mdi-arrow-left"
        block
        variant="ghost"
        @click="() => { navigateTo('/forgot-password') }"
      />
    </div>

    <!-- Reset form -->
    <UAuthForm
      v-else
      :schema="schema"
      :fields="fields"
      :title="t('resetPassword.title')"
      :description="t('resetPassword.description')"
      :submit="{ label: t('resetPassword.resetPassword'), loading }"
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
          :label="t('resetPassword.backToLogin')"
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
const route = useRoute()

const token = route.query.token as string | undefined
const email = route.query.email as string | undefined

const loading = ref(false)
const errorMsg = ref<string | null>(null)

const schema = z.object({
  password: z.string().min(8, t('resetPassword.newPassword')),
  password_confirmation: z.string().min(1, t('resetPassword.confirmPassword')),
}).refine(d => d.password === d.password_confirmation, {
  message: t('resetPassword.passwordMismatch'),
  path: ['password_confirmation'],
})

type Schema = z.output<typeof schema>

const fields = computed(() => [
  {
    name: 'password',
    type: 'password' as const,
    label: t('resetPassword.newPassword'),
    placeholder: '••••••••',
    required: true,
  },
  {
    name: 'password_confirmation',
    type: 'password' as const,
    label: t('resetPassword.confirmPassword'),
    placeholder: '••••••••',
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
    await post('/api/admin/auth/reset_password', {
      token,
      email,
      password: event.data.password,
      password_confirmation: event.data.password_confirmation,
    })
    await navigateTo('/login')
  } catch (e) {
    errorMsg.value = extractErrorMessage(e) ?? t('resetPassword.errorReset')
  } finally {
    loading.value = false
  }
}
</script>
