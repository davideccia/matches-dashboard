<template>
  <div
    class="fixed inset-0 flex flex-col lg:items-center lg:justify-center bg-default"
  >
    <!-- Mobile top strip -->
    <div
      class="h-35 w-full shrink-0 bg-default flex items-center justify-center lg:hidden relative overflow-hidden rounded-b-10"
    >
      <div class="absolute inset-0 opacity-10">
        <div class="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-white/30" />
        <div class="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-white/20" />
      </div>
      <img
        :src="logoSrc"
        alt="Logo"
        class="w-20 h-20 drop-shadow-lg relative z-10 rounded-2xl"
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
          <div class="absolute -top-12 -left-12 w-56 h-56 rounded-full bg-white/10" />
          <div class="absolute top-1/3 -right-16 w-48 h-48 rounded-full bg-white/8" />
          <div class="absolute -bottom-16 left-1/4 w-64 h-64 rounded-full bg-white/6" />
        </div>
        <img
          :src="logoSrc"
          alt="Logo"
          class="w-48 h-48 drop-shadow-2xl relative z-10 rounded-3xl"
        >
      </div>

      <!-- Right panel: form -->
      <div
        class="flex flex-col w-full lg:w-1/2 bg-default px-10 pt-8 pb-6 lg:px-25 lg:pt-25 lg:pb-10 overflow-y-auto"
      >
        <!-- Step 0: request code -->
        <UAuthForm
          v-if="step === 0"
          :schema="schemaStep0"
          :fields="fieldsStep0"
          :title="t('resetPassword.title')"
          :description="t('resetPassword.description')"
          :submit="{ label: t('resetPassword.sendCode'), loading }"
          @submit="onRequestCode"
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
              @click="navigateTo('/login')"
            />
          </template>
        </UAuthForm>

        <!-- Step 1: enter code + new password -->
        <UAuthForm
          v-else
          :schema="schemaStep1"
          :fields="fieldsStep1"
          :title="t('resetPassword.title')"
          :description="email"
          :submit="{ label: t('resetPassword.resetPassword'), loading }"
          @submit="onReset"
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
              @click="navigateTo('/login')"
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

const step = ref(0)
const email = ref('')
const loading = ref(false)
const errorMsg = ref<string | null>(null)

// Step 0 schema
const schemaStep0 = z.object({
  email: z.email(t('resetPassword.email')),
})

type SchemaStep0 = z.output<typeof schemaStep0>

const fieldsStep0 = computed(() => [
  {
    name: 'email',
    type: 'email' as const,
    label: t('resetPassword.email'),
    placeholder: 'email@esempio.com',
    required: true,
  },
])

// Step 1 schema
const schemaStep1 = z.object({
  code: z.string().min(1, t('resetPassword.code')),
  password: z.string().min(8, t('resetPassword.newPassword')),
})

type SchemaStep1 = z.output<typeof schemaStep1>

const fieldsStep1 = computed(() => [
  {
    name: 'code',
    type: 'text' as const,
    label: t('resetPassword.code'),
    required: true,
  },
  {
    name: 'password',
    type: 'password' as const,
    label: t('resetPassword.newPassword'),
    placeholder: '••••••••',
    required: true,
  },
])

async function onRequestCode(event: FormSubmitEvent<SchemaStep0>) {
  errorMsg.value = null
  loading.value = true
  try {
    await post('/forgot_password', { email: event.data.email })
    email.value = event.data.email
    step.value = 1
  } catch {
    errorMsg.value = t('resetPassword.errorRequest')
  } finally {
    loading.value = false
  }
}

async function onReset(event: FormSubmitEvent<SchemaStep1>) {
  errorMsg.value = null
  loading.value = true
  try {
    await post('/reset_password', {
      email: email.value,
      code: event.data.code,
      password: event.data.password,
    })
    await useAuth().login({ email: email.value, password: event.data.password })
    await navigateTo('/admin')
  } catch {
    errorMsg.value = t('resetPassword.errorReset')
  } finally {
    loading.value = false
  }
}
</script>
