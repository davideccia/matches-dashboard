<template>
  <div class="flex flex-col gap-4 rounded-lg border border-warning/40 bg-warning/5 p-4">
    <UAlert
      color="warning"
      variant="soft"
      icon="i-mdi-information-outline"
      :description="t('settings.apiEnvironmentWarning')"
    />

    <UForm
      :schema="schema"
      :state="state"
      class="flex flex-col gap-4"
      @submit="onSubmit"
    >
      <UFormField
        name="baseUrl"
        :label="t('settings.apiBaseUrl')"
        :description="t('settings.apiBaseUrlDesc')"
        required
      >
        <UInputMenu
          v-model="state.baseUrl"
          v-model:open="menuOpen"
          :items="endpointItems"
          create-item="always"
          icon="i-mdi-server-network"
          class="w-full font-mono"
          @create="onCreateEndpoint"
        />
      </UFormField>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <UFormField name="reverbAppKey" :label="t('settings.reverbAppKey')">
          <UInput v-model="state.reverbAppKey" class="w-full font-mono" />
        </UFormField>
        <UFormField name="reverbHost" :label="t('settings.reverbHost')" required>
          <UInput v-model="state.reverbHost" class="w-full font-mono" />
        </UFormField>
        <UFormField name="reverbPort" :label="t('settings.reverbPort')" required>
          <UInput v-model="state.reverbPort" class="w-full font-mono" />
        </UFormField>
        <UFormField name="reverbScheme" :label="t('settings.reverbScheme')" required>
          <USelect v-model="state.reverbScheme" :items="['http', 'https']" class="w-full" />
        </UFormField>
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          type="submit"
          color="warning"
          icon="i-mdi-swap-horizontal"
          :label="t('settings.apiEnvironmentApply')"
        />
        <UButton
          color="neutral"
          variant="outline"
          icon="i-mdi-restore"
          :label="t('settings.apiEnvironmentReset')"
          :disabled="!hasOverride"
          @click="resetOverride()"
        />
      </div>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { ApiConfig } from '~/composables/useApiConfig'
import * as z from 'zod'

const { t } = useI18n()
const { config, endpoints, hasOverride, setOverride, resetOverride } = useApiConfig()

const schema = z.object({
  baseUrl: z.url().transform(v => v.trim().replace(/\/+$/, '')),
  reverbAppKey: z.string(),
  reverbHost: z.string().min(1),
  reverbPort: z.string().regex(/^\d+$/),
  reverbScheme: z.enum(['http', 'https']),
})

const state = reactive<ApiConfig>({ ...config.value })

// UInputMenu annulla la selezione della voce "crea" (preventDefault interno): il valore va
// aggiunto agli items e il menu chiuso a mano, altrimenti sembra che il click non faccia nulla.
const endpointItems = ref<string[]>([...endpoints])
const menuOpen = ref(false)

function onCreateEndpoint(value: string) {
  const url = value.trim().replace(/\/+$/, '')
  if (!endpointItems.value.includes(url)) { endpointItems.value.push(url) }
  state.baseUrl = url
  menuOpen.value = false
}

function onSubmit(event: FormSubmitEvent<z.output<typeof schema>>) {
  setOverride(event.data)
}
</script>
