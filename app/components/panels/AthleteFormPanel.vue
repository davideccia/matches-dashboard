<template>
  <USlideover v-model:open="open" :title="isEdit ? t('athlete.editTitle') : t('athlete.createTitle')" :ui="{ content: 'w-2/5 max-w-none' }">
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
        <UFormField name="first_name" :label="t('athlete.firstName')" required>
          <UInput v-model="state.first_name" class="w-full" />
        </UFormField>

        <UFormField name="last_name" :label="t('athlete.lastName')" required>
          <UInput v-model="state.last_name" class="w-full" />
        </UFormField>

        <UFormField name="birth_date" :label="t('athlete.birthDate')" required>
          <UInput v-model="state.birth_date" type="date" class="w-full" />
        </UFormField>

        <UFormField name="gender" :label="t('athlete.gender.label')" required>
          <USelect v-model="state.gender" :items="genderOptions" class="w-full" />
        </UFormField>

        <UFormField name="tax_number" :label="t('athlete.taxNumber')" required>
          <UInput v-model="state.tax_number" class="w-full" />
        </UFormField>

        <UFormField name="team_name" :label="t('athlete.teamName')">
          <UInput v-model="state.team_name" class="w-full" />
        </UFormField>

        <UFormField name="generic_match_records_count" :label="t('athlete.genericMatchRecordsCount')">
          <div class="flex items-center gap-2">
            <UInput
              :model-value="state.generic_match_records_count !== null ? String(state.generic_match_records_count) : ''"
              type="number"
              min="0"
              class="w-full"
              @update:model-value="(v: string) => state.generic_match_records_count = v === '' ? null : Number(v)"
            />
            <UButton
              v-if="state.generic_match_records_count !== null"
              type="button"
              icon="i-mdi-close"
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-label="t('common.cancel')"
              @click="state.generic_match_records_count = null"
            />
          </div>
        </UFormField>

        <UFormField name="registered_match_records_count" :label="t('athlete.registeredMatchRecordsCount')" :description="t('athlete.registeredMatchRecordsCountHint')">
          <UInput
            :model-value="state.registered_match_records_count !== null ? String(state.registered_match_records_count) : '—'"
            disabled
            class="w-full"
          />
        </UFormField>

        <UFormField name="match_records_count" :label="t('athlete.matchRecordsCount')" :description="t('athlete.matchRecordsCountHint')">
          <UInput
            :model-value="state.match_records_count !== null ? String(state.match_records_count) : '—'"
            disabled
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton variant="ghost" color="neutral" type="button" @click="open = false">
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
import type { Athlete } from '~/types/models'
import * as z from 'zod'
import { type Gender, GENDERS } from '~/utils/constants'

const props = defineProps<{
  item: Athlete | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const open = defineModel<boolean>({ default: false })
const { t } = useI18n()
const api = useApi()
const toast = useToast()

const isEdit = computed(() => props.item !== null)

const genderOptions = computed(() => [
  { label: t('athlete.gender.male'), value: 'male' },
  { label: t('athlete.gender.female'), value: 'female' },
])

const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  birth_date: z.string().min(1),
  gender: z.enum(GENDERS),
  tax_number: z.string().min(1),
  team_name: z.string().optional(),
  generic_match_records_count: z.coerce.number().int().min(0).nullable().optional(),
})

const state = reactive({
  first_name: '',
  last_name: '',
  birth_date: '',
  gender: 'male' as Gender,
  tax_number: '',
  team_name: '',
  generic_match_records_count: null as number | null,
  registered_match_records_count: null as number | null,
  match_records_count: null as number | null,
})

const fetching = ref(false)

watch(open, async (val) => {
  if (!val) { return }
  if (isEdit.value) {
    fetching.value = true
    try {
      const { data: item } = await api.get<{ data: Athlete }>(`/api/admin/athletes/${props.item!.id}`)
      state.first_name = item.first_name
      state.last_name = item.last_name
      state.birth_date = item.birth_date?.slice(0, 10) ?? ''
      state.gender = item.gender ?? 'male'
      state.tax_number = item.tax_number ?? ''
      state.team_name = item.team_name ?? ''
      state.generic_match_records_count = item.generic_match_records_count ?? null
      state.registered_match_records_count = item.registered_match_records_count ?? null
      state.match_records_count = item.match_records_count ?? null
    } catch (e) {
      toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
      open.value = false
    } finally {
      fetching.value = false
    }
  } else {
    state.first_name = ''
    state.last_name = ''
    state.birth_date = ''
    state.gender = 'male'
    state.tax_number = ''
    state.team_name = ''
    state.generic_match_records_count = null
    state.registered_match_records_count = null
    state.match_records_count = null
  }
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<z.infer<typeof schema>>) {
  loading.value = true
  try {
    const body = {
      first_name: event.data.first_name,
      last_name: event.data.last_name,
      birth_date: event.data.birth_date,
      gender: event.data.gender,
      tax_number: event.data.tax_number,
      team_name: event.data.team_name || null,
      generic_match_records_count: event.data.generic_match_records_count ?? null,
    }

    let saved: Athlete
    if (isEdit.value) {
      const { data } = await api.put<{ data: Athlete }>(`/api/admin/athletes/${props.item!.id}`, body)
      saved = data
    } else {
      const { data } = await api.post<{ data: Athlete }>('/api/admin/athletes', body)
      saved = data
    }

    state.first_name = saved.first_name
    state.last_name = saved.last_name
    state.birth_date = saved.birth_date?.slice(0, 10) ?? ''
    state.gender = saved.gender ?? 'male'
    state.tax_number = saved.tax_number ?? ''
    state.team_name = saved.team_name ?? ''
    state.generic_match_records_count = saved.generic_match_records_count ?? null
    state.registered_match_records_count = saved.registered_match_records_count ?? null
    state.match_records_count = saved.match_records_count ?? null

    emit('saved')
    toast.add({
      title: isEdit.value ? t('athlete.updated') : t('athlete.created'),
      color: 'success',
    })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>
