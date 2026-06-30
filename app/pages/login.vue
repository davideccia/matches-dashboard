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
        class="w-20 h-20 drop-shadow-lg relative z-10 rounded-2xl"
      >
    </div>

    <!-- Card: grows full height on mobile, fixed max-width centered on desktop -->
    <div
      class="flex flex-col lg:flex-row w-full max-w-370 grow lg:grow-0 overflow-hidden rounded-t-10 lg:rounded-10 lg:min-h-187.5 2xl:min-h-auto lg:mx-6"
    >
      <!-- Left panel: visible only on desktop -->
      <div
        class="hidden lg:flex lg:w-1/2 xl:w-3/5 2xl:w-2/3 bg-default rounded-3xl m-10 items-center justify-center relative overflow-hidden border-2 border-accented"
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
        class="flex flex-col w-full lg:w-1/2 xl:w-2/5 2xl:w-1/3 bg-default px-10 pt-8 pb-6 lg:px-25 xl:px-20 2xl:px-16 lg:pt-25 lg:pb-10 overflow-y-auto"
      >
        <UAuthForm
          :schema="schema"
          :fields="fields"
          :title="t('login.title')"
          :description="t('login.description')"
          :submit="{ label: t('login.submit'), loading }"
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
            <UButton
              :label="t('login.forgotPassword')"
              icon="i-mdi-lock-reset"
              block
              variant="ghost"
              @click="navigateTo('/forgot-password')"
            />
            <USeparator class="mb-4" />
            <UButton
              :label="t('login.registerCard.cta')"
              icon="i-mdi-account-plus"
              block
              variant="outline"
              @click="navigateTo('/public/athletes/registration')"
            />
            <USeparator class="mb-4" />
            <UButton
              :label="t('login.tournamentsView.cta')"
              icon="i-mdi-sword-cross"
              block
              variant="outline"
              @click="navigateTo('/public/tournaments/match_records')"
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
const { clear } = useUser()

const schema = z.object({
  email: z.email(t('login.email')),
  password: z.string().min(1, t('login.password')),
})

type Schema = z.output<typeof schema>

const fields = computed(() => [
  {
    name: 'email',
    type: 'email' as const,
    label: t('login.email'),
    placeholder: 'email@esempio.com',
    required: true,
  },
  {
    name: 'password',
    type: 'password' as const,
    label: t('login.password'),
    placeholder: '••••••••',
    required: true,
  },
])

const loading = ref(false)
const errorMsg = ref<string | null>(null)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  errorMsg.value = null
  loading.value = true
  try {
    clear()
    await useAuth().login({ email: event.data.email, password: event.data.password })
    await navigateTo('/admin')
  } catch {
    errorMsg.value = t('login.error')
  } finally {
    loading.value = false
  }
}
</script>
