<template>
  <USlideover
    v-model:open="open"
    :title="isEdit ? t('experienceTier.editTitle') : t('experienceTier.createTitle')"
    :ui="{ content: 'w-2/5 max-w-none' }"
  >
    <template #body>
      <div v-if="fetching" class="flex items-center justify-center p-12">
        <UIcon name="i-mdi-loading" class="animate-spin text-2xl" />
      </div>
      <UForm
        v-else
        :schema="schema"
        :state="state"
        class="space-y-6 p-6"
        @submit="onSubmit"
      >
        <UFormField name="label" :label="t('experienceTier.label')" required>
          <UInput v-model="state.label" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <UFormField name="min_match_count" :label="t('experienceTier.minMatchCount')" required>
            <UInputNumber v-model="state.min_match_count" :min="0" class="w-full" />
          </UFormField>

          <UFormField
            name="max_match_count"
            :label="t('experienceTier.maxMatchCount')"
            :help="t('experienceTier.maxHint')"
          >
            <UInputNumber
              v-model="state.max_match_count"
              :min="0"
              :placeholder="t('experienceTier.unbounded')"
              class="w-full"
            />
          </UFormField>
        </div>

        <UAlert
          v-if="state.min_match_count != null"
          color="neutral"
          variant="subtle"
          icon="i-mdi-stairs"
          :description="t('experienceTier.rangePreview', { range: formatTierRange(state.min_match_count, state.max_match_count) })"
        />

        <UFormField
          name="enabled"
          :label="t('experienceTier.enabled')"
          :help="t('experienceTier.enabledHint')"
        >
          <USwitch v-model="state.enabled" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton variant="ghost" color="neutral" type="button" @click="() => { open = false }">
            {{ t('common.cancel') }}
          </UButton>
          <UButton type="submit" :loading="loading">
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
  item: ExperienceTier | null
  // Valorizzata ⇒ il tier appartiene a un torneo (create sull'endpoint nested).
  // Assente/null ⇒ tier globale.
  tournamentId?: string | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const open = defineModel<boolean>({ default: false })
const { t } = useI18n()
const api = useApi()
const toast = useToast()

const isEdit = computed(() => props.item !== null)

// UInputNumber emits real numbers, and `undefined` once the field is cleared —
// so an emptied max means "unbounded" and an emptied min fails as required.
const schema = z.object({
  label: z.string().min(1),
  min_match_count: z.number().int().min(0),
  max_match_count: z.number().int().min(0).nullish(),
  enabled: z.boolean(),
}).refine(
  data => data.max_match_count == null || data.max_match_count >= data.min_match_count,
  { path: ['max_match_count'], message: t('experienceTier.maxLowerThanMin') },
)

const state = reactive<{
  label: string
  min_match_count: number | undefined
  max_match_count: number | null | undefined
  enabled: boolean
}>({
  label: '',
  min_match_count: 0,
  max_match_count: null,
  enabled: false,
})

const fetching = ref(false)

watch(open, async (val) => {
  if (!val) { return }
  if (isEdit.value) {
    fetching.value = true
    try {
      const { data: item } = await api.get<{ data: ExperienceTier }>(`/api/admin/experience_tiers/${props.item!.id}`)
      state.label = item.label
      state.min_match_count = item.min_match_count
      state.max_match_count = item.max_match_count ?? null
      state.enabled = item.enabled
    } catch (e) {
      toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
      open.value = false
    } finally {
      fetching.value = false
    }
  } else {
    state.label = ''
    state.min_match_count = 0
    state.max_match_count = null
    state.enabled = false
  }
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<z.infer<typeof schema>>) {
  loading.value = true
  try {
    const body = {
      label: event.data.label,
      min_match_count: event.data.min_match_count,
      max_match_count: event.data.max_match_count ?? null,
      enabled: event.data.enabled,
      // Obbligatorio anche in edit: la rotta flat non ha il param {tournament}, quindi
      // il backend farebbe default a null e declasserebbe il tier a globale.
      tournament_id: props.tournamentId ?? props.item?.tournament_id ?? null,
    }

    let saved: ExperienceTier
    if (isEdit.value) {
      const { data } = await api.put<{ data: ExperienceTier }>(`/api/admin/experience_tiers/${props.item!.id}`, body)
      saved = data
    } else {
      const { data } = await api.post<{ data: ExperienceTier }>(
        props.tournamentId
          ? `/api/admin/tournaments/${props.tournamentId}/experience_tiers`
          : '/api/admin/experience_tiers',
        body,
      )
      saved = data
    }

    state.label = saved.label
    state.min_match_count = saved.min_match_count
    state.max_match_count = saved.max_match_count ?? null
    state.enabled = saved.enabled

    emit('saved')
    toast.add({
      title: isEdit.value ? t('experienceTier.updated') : t('experienceTier.created'),
      color: 'success',
    })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>
