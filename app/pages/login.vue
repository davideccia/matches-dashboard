<template>
  <AuthSplitLayout
    logo-variant="boxed"
    logo-unlockable
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
          variant="outline"
          @click="
            () => {
              navigateTo('/forgot-password');
            }
          "
        />
      </template>
    </UAuthForm>

    <USeparator class="my-6" :ui="{ border: 'border-inverted' }" />

    <div class="rounded-xl bg-default p-4">
      <p class="text-sm text-center mb-3">
        {{ t("common.notWhatYouAreLookingFor") }}
      </p>

      <UButton
        :label="t('common.backHome')"
        icon="i-mdi-arrow-left"
        block
        variant="outline"
        color="neutral"
        @click="
          () => {
            navigateTo('/');
          }
        "
      />
    </div>
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
    await useAuth().login({
      email: event.data.email,
      password: event.data.password,
    })
    await navigateTo('/admin')
  } catch {
    errorMsg.value = t('login.error')
  } finally {
    loading.value = false
  }
}
</script>
