<template>
  <div class="flex flex-col gap-4 rounded-lg border border-warning/40 bg-warning/5 p-4">
    <div v-if="header || !isProduction" class="flex items-start justify-between gap-3">
      <div v-if="header">
        <p class="text-sm font-semibold text-highlighted flex items-center gap-1.5">
          <UIcon name="i-mdi-alert-outline" class="size-4 text-warning" />
          {{ t('settings.apiEnvironment') }}
        </p>
        <p class="text-xs text-muted">
          {{ t('settings.apiEnvironmentDesc') }}
        </p>
      </div>
      <UBadge
        v-if="!isProduction"
        color="warning"
        variant="subtle"
        icon="i-mdi-flask-outline"
        class="shrink-0"
      >
        {{ hasOverride ? t('settings.apiEnvironmentOverridden') : t('settings.apiEnvironmentNotProduction') }}
      </UBadge>
    </div>

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

// header: false quando il titolo è già fornito dal contenitore (es. UModal).
const { header = true } = defineProps<{ header?: boolean }>()

const { t } = useI18n()
const { config, endpoints, hasOverride, isProduction, setOverride, resetOverride } = useApiConfig()

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
