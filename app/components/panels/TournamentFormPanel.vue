<template>
  <USlideover
    v-model:open="open"
    :title="isEdit ? t('tournament.editTitle') : t('tournament.createTitle')"
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
        <UFormField name="name" :label="t('tournament.name')" required>
          <UInput v-model="state.name" class="w-full" />
        </UFormField>

        <UFormField name="location_name" :label="t('tournament.locationName')" required>
          <UInput v-model="state.location_name" class="w-full" />
        </UFormField>

        <UFormField name="location_city" :label="t('tournament.locationCity')" required>
          <UInput v-model="state.location_city" class="w-full" />
        </UFormField>

        <UFormField name="location_address" :label="t('tournament.locationAddress')" required>
          <UInput v-model="state.location_address" class="w-full" />
        </UFormField>

        <UFormField name="date" :label="t('tournament.date')" required>
          <UInput v-model="state.date" type="date" class="w-full" />
        </UFormField>

        <UFormField name="status" :label="t('tournament.status.label')" required>
          <USelect v-model="state.status" :items="statusOptions" class="w-full" />
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
import type { Tournament } from '~/types/models'
import * as z from 'zod'
import { TOURNAMENT_STATUSES, type TournamentStatus } from '~/utils/constants'

const props = defineProps<{
  item: Tournament | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const open = defineModel<boolean>({ default: false })
const { t } = useI18n()
const api = useApi()
const toast = useToast()

const isEdit = computed(() => props.item !== null)

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
  name: '',
  location_name: '',
  location_address: '',
  location_city: '',
  date: '',
  status: 'scheduled' as TournamentStatus,
})

const fetching = ref(false)

watch(open, async (val) => {
  if (!val) { return }
  if (isEdit.value) {
    fetching.value = true
    try {
      const { data: tournament } = await api.get<{ data: Tournament }>(`/api/admin/tournaments/${props.item!.id}`)
      state.name = tournament.name
      state.location_name = tournament.location_name
      state.location_address = tournament.location_address
      state.location_city = tournament.location_city
      state.date = tournament.date.slice(0, 10)
      state.status = tournament.status
    } catch (e) {
      toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
      open.value = false
    } finally {
      fetching.value = false
    }
  } else {
    state.name = ''
    state.location_name = ''
    state.location_address = ''
    state.location_city = ''
    state.date = ''
    state.status = 'scheduled'
  }
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<z.infer<typeof schema>>) {
  loading.value = true
  try {
    const body = {
      name: event.data.name,
      location_name: event.data.location_name,
      location_address: event.data.location_address,
      location_city: event.data.location_city,
      date: event.data.date,
      status: event.data.status,
    }

    let saved: Tournament
    if (isEdit.value) {
      const { data } = await api.put<{ data: Tournament }>(`/api/admin/tournaments/${props.item!.id}`, body)
      saved = data
    } else {
      const { data } = await api.post<{ data: Tournament }>('/api/admin/tournaments', body)
      saved = data
    }

    state.name = saved.name
    state.location_name = saved.location_name
    state.location_address = saved.location_address
    state.location_city = saved.location_city
    state.date = saved.date.slice(0, 10)
    state.status = saved.status

    emit('saved')
    toast.add({
      title: isEdit.value ? t('tournament.updated') : t('tournament.created'),
      color: 'success',
    })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>
