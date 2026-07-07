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
      <img
        :src="logoSrc"
        alt="Logo"
        class="w-20 h-20 drop-shadow-lg relative z-10 rounded-2xl border-4 border-primary"
      >
    </div>

    <div
      class="flex flex-col lg:flex-row w-full max-w-370 grow lg:grow-0 overflow-hidden rounded-t-10 lg:rounded-10 lg:min-h-187.5 lg:mx-6"
    >
      <!-- Left panel -->
      <div
        class="hidden lg:flex lg:w-1/2 bg-default rounded-3xl m-10 items-center justify-center relative overflow-hidden border-2 border-accented"
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
        <img
          :src="logoSrc"
          alt="Logo"
          class="w-48 h-48 drop-shadow-2xl relative z-10 rounded-3xl border-4 border-primary"
        >
      </div>

      <!-- Right panel: form -->
      <div
        class="flex flex-col w-full lg:w-1/2 bg-default px-10 pt-8 pb-6 lg:px-25 lg:pt-25 lg:pb-10 overflow-y-auto"
      >
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

        <div class="grow" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'
import logoSrc from '~/assets/logo.png'

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
