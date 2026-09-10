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
          <div class="flex flex-col gap-2">
            <div class="border border-default rounded-lg overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-elevated border-b border-default">
                    <th class="px-3 py-2 text-left font-medium text-muted">
                      {{ t('athlete.matchRecordsHistoryDiscipline') }}
                    </th>
                    <th class="px-3 py-2 text-left font-medium text-muted w-32">
                      {{ t('athlete.matchRecordsHistoryManualTotal') }}
                    </th>
                    <th class="px-3 py-2 text-left font-medium text-muted w-28">
                      {{ t('athlete.matchRecordsHistoryAppTotal') }}
                    </th>
                    <th class="px-3 py-2 text-left font-medium text-muted w-24">
                      {{ t('athlete.matchRecordsHistoryTotal') }}
                    </th>
                    <th class="w-10" />
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="state.match_records_history_rows.length === 0">
                    <td colspan="5" class="px-3 py-8 text-center text-sm italic text-muted">
                      {{ t('athlete.matchRecordsHistoryEmpty') }}
                    </td>
                  </tr>
                  <tr
                    v-for="(row, index) in state.match_records_history_rows"
                    :key="index"
                    class="border-t border-default/60"
                  >
                    <td class="px-3 py-2 align-top">
                      <UFormField :name="`match_records_history_rows.${index}.label`">
                        <div class="flex items-center gap-2">
                          <ApiSelectMenu
                            v-if="!row.useManualLabel"
                            :model-value="row.id"
                            endpoint="/api/admin/disciplines"
                            label-key="label"
                            :placeholder="t('athlete.matchRecordsHistorySelectDiscipline')"
                            class="w-full"
                            @update:model-value="(v: string | null) => setRowDisciplineId(index, v)"
                            @select="(item: Record<string, unknown>) => setRowDiscipline(index, item)"
                          />
                          <UInput
                            v-else
                            v-model="row.label"
                            size="sm"
                            class="w-full"
                            :placeholder="t('athlete.matchRecordsHistoryManualLabel')"
                          />
                          <UButton
                            type="button"
                            :icon="row.useManualLabel ? 'i-mdi-format-list-bulleted' : 'i-mdi-pencil-outline'"
                            variant="ghost"
                            color="neutral"
                            size="sm"
                            :aria-label="t('athlete.matchRecordsHistoryUseManualLabel')"
                            @click="() => switchRowToManual(index, !row.useManualLabel)"
                          />
                        </div>
                      </UFormField>
                    </td>
                    <td class="px-3 py-2 align-top">
                      <UFormField :name="`match_records_history_rows.${index}.manual_total`">
                        <UInputNumber v-model="row.manual_total" :min="0" size="sm" class="w-full" />
                      </UFormField>
                    </td>
                    <td class="px-3 py-2 align-top tabular-nums text-muted">
                      {{ row.app_total }}
                    </td>
                    <td class="px-3 py-2 align-top tabular-nums text-muted">
                      {{ row.manual_total + row.app_total }}
                    </td>
                    <td class="px-3 py-2 align-top text-right">
                      <UButton
                        type="button"
                        icon="i-mdi-close"
                        variant="ghost"
                        color="neutral"
                        size="xs"
                        :aria-label="t('athlete.matchRecordsHistoryRemoveRow')"
                        @click="removeHistoryRow(index)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <UButton
              type="button"
              icon="i-mdi-plus"
              variant="subtle"
              color="neutral"
              size="sm"
              class="self-start"
              @click="addHistoryRow"
            >
              {{ t('athlete.matchRecordsHistoryAddRow') }}
            </UButton>
          </div>
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

interface HistoryRow {
  id: string | null
  label: string
  manual_total: number
  app_total: number
  useManualLabel: boolean
}

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

function blankHistoryRow(): HistoryRow {
  return {
    id: null,
    label: '',
    manual_total: 0,
    app_total: 0,
    useManualLabel: false,
  }
}

function historyRowsFromAthlete(item: Athlete): HistoryRow[] {
  return (item.match_records_history?.disciplines ?? []).map(d => ({
    id: d.id,
    label: d.label,
    manual_total: d.manual_total,
    app_total: d.app_total,
    useManualLabel: d.id === null,
  }))
}

function addHistoryRow() {
  state.match_records_history_rows = [...state.match_records_history_rows, blankHistoryRow()]
}

function removeHistoryRow(index: number) {
  state.match_records_history_rows = state.match_records_history_rows.filter((_, i) => i !== index)
}

function setRowDisciplineId(index: number, value: string | null) {
  const row = state.match_records_history_rows[index]
  if (row) { row.id = value }
}

function setRowDiscipline(index: number, item: Record<string, unknown>) {
  const row = state.match_records_history_rows[index]
  if (row) { row.label = String(item.label ?? '') }
}

function switchRowToManual(index: number, manual: boolean) {
  const row = state.match_records_history_rows[index]
  if (!row) { return }
  row.useManualLabel = manual
  if (manual) { row.id = null }
}

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
