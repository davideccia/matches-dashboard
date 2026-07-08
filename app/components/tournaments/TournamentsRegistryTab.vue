<template>
  <div class="p-6">
    <UCard>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <UFormField name="status" :label="t('tournament.status.label')" required>
          <USelect v-model="state.status" :items="statusOptions" class="w-full sm:w-64" />
        </UFormField>

        <USeparator />

        <div class="space-y-4">
          <h4 class="flex items-center gap-2 text-sm font-medium text-muted">
            <UIcon name="i-mdi-information-outline" class="size-4" />
            {{ t('tournament.section.general') }}
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <UFormField name="name" :label="t('tournament.name')" required>
              <UInput v-model="state.name" class="w-full" />
            </UFormField>

            <UFormField name="date" :label="t('tournament.date')" required>
              <UInput v-model="state.date" type="date" class="w-full" />
            </UFormField>
          </div>
        </div>

        <USeparator />

        <div class="space-y-4">
          <h4 class="flex items-center gap-2 text-sm font-medium text-muted">
            <UIcon name="i-mdi-map-marker-outline" class="size-4" />
            {{ t('tournament.section.location') }}
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <UFormField name="location_name" :label="t('tournament.locationName')" required>
              <UInput v-model="state.location_name" class="w-full" />
            </UFormField>

            <UFormField name="location_city" :label="t('tournament.locationCity')" required>
              <UInput v-model="state.location_city" class="w-full" />
            </UFormField>

            <UFormField name="location_address" :label="t('tournament.locationAddress')" required class="sm:col-span-2">
              <UInput v-model="state.location_address" class="w-full" />
            </UFormField>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <UButton type="submit" :loading="saving">
            {{ t('common.save') }}
          </UButton>
        </div>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Tournament } from '~/types/models'
import * as z from 'zod'
import { TOURNAMENT_STATUSES, type TournamentStatus } from '~/utils/constants'

const { tournament } = defineProps<{
  tournament: Tournament
}>()

const emit = defineEmits<{
  saved: []
}>()

const { t } = useI18n()
const api = useApi()
const toast = useToast()

const statusOptions = computed(() => [
  { label: t('tournament.status.scheduled'), value: 'scheduled' },
  { label: t('tournament.status.registrations_opened'), value: 'registrations_opened' },
  { label: t('tournament.status.registrations_closed'), value: 'registrations_closed' },
  { label: t('tournament.status.in_progress'), value: 'in_progress' },
  { label: t('tournament.status.completed'), value: 'completed' },
  { label: t('tournament.status.cancelled'), value: 'cancelled' },
])

const schema = z.object({
  name: z.string().min(1),
  location_name: z.string().min(1),
  location_address: z.string().min(1),
  location_city: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(TOURNAMENT_STATUSES),
})

const state = reactive({
  name: tournament.name,
  location_name: tournament.location_name,
  location_address: tournament.location_address,
  location_city: tournament.location_city,
  date: serverDateOnlyToInput(tournament.date),
  status: tournament.status as TournamentStatus,
})

watch(() => tournament.id, () => {
  state.name = tournament.name
  state.location_name = tournament.location_name
  state.location_address = tournament.location_address
  state.location_city = tournament.location_city
  state.date = serverDateOnlyToInput(tournament.date)
  state.status = tournament.status
})

const saving = ref(false)

async function onSubmit(event: FormSubmitEvent<z.infer<typeof schema>>) {
  saving.value = true
  try {
    const body = {
      name: event.data.name,
      location_name: event.data.location_name,
      location_address: event.data.location_address,
      location_city: event.data.location_city,
      date: event.data.date,
      status: event.data.status,
    }

    await api.put<{ data: Tournament }>(`/api/admin/tournaments/${tournament.id}`, body)

    emit('saved')
    toast.add({ title: t('tournament.updated'), color: 'success' })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>
