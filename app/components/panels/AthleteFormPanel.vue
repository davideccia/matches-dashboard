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

        <UFormField name="email" :label="t('athlete.email')" required>
          <UInput v-model="state.email" type="email" class="w-full" />
        </UFormField>

        <UFormField name="phone_number" :label="t('athlete.phoneNumber')">
          <UInput v-model="state.phone_number" type="tel" class="w-full" />
        </UFormField>

        <UFormField name="team_name" :label="t('athlete.teamName')">
          <UInput v-model="state.team_name" class="w-full" />
        </UFormField>

        <UFormField :label="t('athlete.matchRecordsHistory')">
          <AthleteMatchRecordsHistoryEditor v-model="state.match_records_history_rows" />
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
import type { Athlete } from '~/types/models'
import type { HistoryRow } from '~/utils/athleteMatchRecordsHistory'
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

const historyRowSchema = z.object({
  id: z.string().nullable().optional(),
  label: z.string().min(1),
  manual_total: z.coerce.number().int().min(0),
})

const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  birth_date: z.string().min(1),
  gender: z.enum(GENDERS),
  tax_number: z.string().min(1),
  email: z.email(),
  phone_number: z.string().optional(),
  team_name: z.string().optional(),
  match_records_history_rows: z.array(historyRowSchema),
})

const state = reactive({
  first_name: '',
  last_name: '',
  birth_date: '',
  gender: 'male' as Gender,
  tax_number: '',
  email: '',
  phone_number: '',
  team_name: '',
  match_records_history_rows: [] as HistoryRow[],
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
      state.birth_date = serverDateOnlyToInput(item.birth_date)
      state.gender = item.gender ?? 'male'
      state.tax_number = item.tax_number ?? ''
      state.email = item.email
      state.phone_number = item.phone_number ?? ''
      state.team_name = item.team_name ?? ''
      state.match_records_history_rows = historyRowsFromAthlete(item)
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
    state.email = ''
    state.phone_number = ''
    state.team_name = ''
    state.match_records_history_rows = []
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
      email: event.data.email,
      phone_number: event.data.phone_number || null,
      team_name: event.data.team_name || null,
      match_records_history: {
        disciplines: event.data.match_records_history_rows.map(row => ({
          id: row.id ?? null,
          label: row.label,
          manual_total: row.manual_total,
        })),
      },
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
    state.birth_date = serverDateOnlyToInput(saved.birth_date)
    state.gender = saved.gender ?? 'male'
    state.tax_number = saved.tax_number ?? ''
    state.email = saved.email
    state.phone_number = saved.phone_number ?? ''
    state.team_name = saved.team_name ?? ''
    state.match_records_history_rows = historyRowsFromAthlete(saved)

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
