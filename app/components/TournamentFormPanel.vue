<template>
  <USlideover
    v-model:open="open"
    :title="isEdit ? t('tournament.editTitle') : t('tournament.createTitle')"
  >
    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-6 p-6" @submit="onSubmit">
        <UFormField name="name" :label="t('tournament.name')" required>
          <UInput v-model="state.name" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField name="locationName" :label="t('tournament.locationName')" required>
            <UInput v-model="state.locationName" class="w-full" />
          </UFormField>

          <UFormField name="locationCity" :label="t('tournament.locationCity')" required>
            <UInput v-model="state.locationCity" class="w-full" />
          </UFormField>
        </div>

        <UFormField name="locationAddress" :label="t('tournament.locationAddress')" required>
          <UInput v-model="state.locationAddress" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField name="date" :label="t('tournament.date')" required>
            <UInput v-model="state.date" type="date" class="w-full" />
          </UFormField>

          <UFormField name="status" :label="t('tournament.status.label')" required>
            <USelect v-model="state.status" :items="statusOptions" class="w-full" />
          </UFormField>
        </div>

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
  { label: t('tournament.status.SCHEDULED'), value: 'SCHEDULED' },
  { label: t('tournament.status.REGISTRATIONS_OPENED'), value: 'REGISTRATIONS_OPENED' },
  { label: t('tournament.status.REGISTRATIONS_CLOSED'), value: 'REGISTRATIONS_CLOSED' },
  { label: t('tournament.status.IN_PROGRESS'), value: 'IN_PROGRESS' },
  { label: t('tournament.status.COMPLETED'), value: 'COMPLETED' },
  { label: t('tournament.status.CANCELLED'), value: 'CANCELLED' },
])

const schema = z.object({
  name: z.string().min(1),
  locationName: z.string().min(1),
  locationAddress: z.string().min(1),
  locationCity: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(TOURNAMENT_STATUSES),
})

const state = reactive({
  name: '',
  locationName: '',
  locationAddress: '',
  locationCity: '',
  date: '',
  status: 'SCHEDULED' as TournamentStatus,
})

watch(open, (val) => {
  if (val) {
    state.name = props.item?.name ?? ''
    state.locationName = props.item?.locationName ?? ''
    state.locationAddress = props.item?.locationAddress ?? ''
    state.locationCity = props.item?.locationCity ?? ''
    state.date = props.item?.date ?? ''
    state.status = props.item?.status ?? 'SCHEDULED'
  }
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<z.infer<typeof schema>>) {
  loading.value = true
  try {
    const body = {
      name: event.data.name,
      locationName: event.data.locationName,
      locationAddress: event.data.locationAddress,
      locationCity: event.data.locationCity,
      date: event.data.date,
      status: event.data.status,
    }

    if (isEdit.value) {
      await api.put(`/api/desktop/tournaments/${props.item!.id}`, body)
    } else {
      await api.post('/api/desktop/tournaments', body)
    }

    open.value = false
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
