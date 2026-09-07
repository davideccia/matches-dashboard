<template>
  <USlideover
    v-model:open="open"
    :title="t('experienceTier.batchCreateTitle')"
    :ui="{ content: 'sm:max-w-none sm:w-[65vw]' }"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="flex flex-col gap-4 p-6"
        @submit="onSubmit"
      >
        <div class="flex gap-2">
          <UButton
            type="button"
            icon="i-mdi-plus"
            variant="subtle"
            color="neutral"
            @click="addRow"
          >
            {{ t('experienceTier.addRow') }}
          </UButton>
          <UButton
            type="button"
            icon="i-mdi-download"
            variant="subtle"
            color="neutral"
            :loading="importing"
            @click="importDefaults"
          >
            {{ t('experienceTier.importDefaults') }}
          </UButton>
        </div>

        <div class="border border-default rounded-lg overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-elevated border-b border-default">
                <th class="px-3 py-2 text-left font-medium text-muted">
                  {{ t('experienceTier.label') }}
                </th>
                <th class="px-3 py-2 text-left font-medium text-muted w-36">
                  {{ t('experienceTier.minMatchCount') }}
                </th>
                <th class="px-3 py-2 text-left font-medium text-muted w-36">
                  {{ t('experienceTier.maxMatchCount') }}
                </th>
                <th class="px-3 py-2 text-right font-medium text-muted w-32">
                  {{ t('experienceTier.range') }}
                </th>
                <th class="px-3 py-2 text-center font-medium text-muted w-24">
                  {{ t('experienceTier.enabled') }}
                </th>
                <th class="w-10" />
              </tr>
            </thead>
            <tbody>
              <tr v-if="state.tiers.length === 0">
                <td colspan="6" class="px-3 py-8 text-center text-sm italic text-muted">
                  {{ t('experienceTier.batchEmpty') }}
                </td>
              </tr>
              <tr
                v-for="(row, index) in state.tiers"
                :key="index"
                class="border-t border-default/60"
              >
                <td class="px-3 py-2 align-top">
                  <UFormField :name="`tiers.${index}.label`">
                    <UInput v-model="row.label" size="sm" class="w-full" />
                  </UFormField>
                </td>
                <td class="px-3 py-2 align-top">
                  <UFormField :name="`tiers.${index}.min_match_count`">
                    <UInputNumber v-model="row.min_match_count" :min="0" size="sm" class="w-full" />
                  </UFormField>
                </td>
                <td class="px-3 py-2 align-top">
                  <UFormField :name="`tiers.${index}.max_match_count`">
                    <UInputNumber
                      v-model="row.max_match_count"
                      :min="0"
                      :placeholder="t('experienceTier.unbounded')"
                      size="sm"
                      class="w-full"
                    />
                  </UFormField>
                </td>
                <td class="px-3 py-2 align-top text-right tabular-nums text-muted">
                  {{ row.min_match_count != null ? formatTierRange(row.min_match_count, row.max_match_count) : '—' }}
                </td>
                <td class="px-3 py-2 align-top text-center">
                  <UFormField :name="`tiers.${index}.enabled`">
                    <USwitch v-model="row.enabled" />
                  </UFormField>
                </td>
                <td class="px-3 py-2 align-top text-right">
                  <UButton
                    type="button"
                    icon="i-mdi-close"
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    :aria-label="t('experienceTier.removeRow')"
                    @click="removeRow(index)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <UButton variant="ghost" color="neutral" type="button" @click="() => { open = false }">
            {{ t('common.cancel') }}
          </UButton>
          <UButton type="submit" :loading="saving">
            {{ t('common.save') }}
          </UButton>
        </div>
      </UForm>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { ExperienceTier } from '~/types/models'
import * as z from 'zod'

const props = defineProps<{
  tournamentId: string
}>()

const emit = defineEmits<{
  saved: []
}>()

const open = defineModel<boolean>({ default: false })
const { t } = useI18n()
const api = useApi()
const toast = useToast()

interface TierRow {
  label: string
  min_match_count: number | undefined
  max_match_count: number | null | undefined
  enabled: boolean
}

// Stesso refine di ExperienceTierFormPanel, ripetuto per riga.
const tierRowSchema = z.object({
  label: z.string().min(1),
  min_match_count: z.number().int().min(0),
  max_match_count: z.number().int().min(0).nullish(),
  enabled: z.boolean(),
}).refine(
  data => data.max_match_count == null || data.max_match_count >= data.min_match_count,
  { path: ['max_match_count'], message: t('experienceTier.maxLowerThanMin') },
)

const schema = z.object({
  tiers: z.array(tierRowSchema).min(1, t('experienceTier.batchEmpty')),
})

const state = reactive<{ tiers: TierRow[] }>({
  tiers: [],
})

watch(open, (val) => {
  if (!val) { return }
  state.tiers = []
})

function blankRow(): TierRow {
  return {
    label: '',
    min_match_count: 0,
    max_match_count: null,
    enabled: false,
  }
}

function addRow() {
  state.tiers = [...state.tiers, blankRow()]
}

function removeRow(index: number) {
  state.tiers = state.tiers.filter((_, i) => i !== index)
}

const importing = ref(false)

async function importDefaults() {
  importing.value = true
  try {
    const { data } = await api.get<{ data: ExperienceTier[] }>('/api/admin/experience_tiers', { only_global: 1 })
    if (data.length === 0) {
      toast.add({ title: t('experienceTier.importDefaultsEmpty'), color: 'neutral' })
      return
    }
    const imported: TierRow[] = data.map(tier => ({
      label: tier.label,
      min_match_count: tier.min_match_count,
      max_match_count: tier.max_match_count ?? null,
      enabled: tier.enabled,
    }))
    state.tiers = [...state.tiers, ...imported]
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    importing.value = false
  }
}

const saving = ref(false)

async function onSubmit(event: FormSubmitEvent<z.infer<typeof schema>>) {
  saving.value = true
  try {
    const body = {
      experience_tiers: event.data.tiers.map(tier => ({
        label: tier.label,
        min_match_count: tier.min_match_count,
        max_match_count: tier.max_match_count ?? null,
        enabled: tier.enabled,
        // Come in ExperienceTierFormPanel: il backend non lo deduce dalla rotta nested.
        tournament_id: props.tournamentId,
      })),
    }

    await api.post(`/api/admin/tournaments/${props.tournamentId}/experience_tiers/batch`, body)

    emit('saved')
    toast.add({ title: t('experienceTier.batchCreated'), color: 'success' })
    open.value = false
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>
