<template>
  <USlideover v-model:open="open" :title="isEdit ? t('registration.editTitle') : t('registration.createTitle')">
    <template #body>
      <UForm :schema="schema" :state="state as any" class="space-y-6 p-6" @submit="(e: any) => onSubmit(e)">
        <UFormField name="athlete_id" :label="t('registration.athlete')" required>
          <div class="flex items-center gap-2">
            <ApiSelectMenu
              v-model="state.athlete_id"
              endpoint="/api/admin/athletes"
              label-key="full_name"
              :placeholder="t('registration.selectAthlete')"
              :disabled="isEdit"
              class="w-full"
            />
            <UButton
              v-if="state.athlete_id !== null && !isEdit"
              type="button"
              icon="i-mdi-close"
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-label="t('common.cancel')"
              @click="state.athlete_id = null"
            />
          </div>
        </UFormField>

        <UFormField name="tournament_id" :label="t('registration.tournament')" required>
          <div class="flex items-center gap-2">
            <ApiSelectMenu
              v-model="state.tournament_id"
              endpoint="/api/admin/tournaments"
              label-key="name"
              :placeholder="t('registration.selectTournament')"
              :disabled="isEdit"
              class="w-full"
            />
            <UButton
              v-if="state.tournament_id !== null && !isEdit"
              type="button"
              icon="i-mdi-close"
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-label="t('common.cancel')"
              @click="state.tournament_id = null"
            />
          </div>
        </UFormField>

        <UFormField name="discipline_id" :label="t('registration.discipline')" required>
          <div class="flex items-center gap-2">
            <ApiSelectMenu
              v-model="state.discipline_id"
              endpoint="/api/admin/disciplines"
              label-key="label"
              :placeholder="t('registration.selectDiscipline')"
              class="w-full"
            />
            <UButton
              v-if="state.discipline_id !== null"
              type="button"
              icon="i-mdi-close"
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-label="t('common.cancel')"
              @click="state.discipline_id = null"
            />
          </div>
        </UFormField>

        <UFormField name="weight_category_id" :label="t('registration.weightCategory')" required>
          <div class="flex items-center gap-2">
            <ApiSelectMenu
              v-model="state.weight_category_id"
              endpoint="/api/admin/weight_categories"
              label-key="label"
              :placeholder="t('registration.selectWeightCategory')"
              class="w-full"
            />
            <UButton
              v-if="state.weight_category_id !== null"
              type="button"
              icon="i-mdi-close"
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-label="t('common.cancel')"
              @click="state.weight_category_id = null"
            />
          </div>
        </UFormField>

        <UFormField name="paid_at" :label="t('registration.paidAt')">
          <div class="flex flex-col gap-2">
            <UButton
              type="button"
              icon="i-mdi-clock-outline"
              variant="outline"
              color="neutral"
              size="sm"
              :label="t('common.now')"
              class="w-full"
              @click="setPaidAtNow"
            />
            <div class="flex items-center gap-2">
              <UPopover v-model:open="paidAtOpen" class="w-1/2">
                <UInputDate v-model="paidAtDate" color="neutral" class="w-full">
                  <template #leading>
                    <UIcon name="i-mdi-calendar" class="cursor-pointer text-muted" @click.stop="paidAtOpen = !paidAtOpen" />
                  </template>
                </UInputDate>
                <template #content>
                  <UCalendar v-model="paidAtDate" class="p-2" />
                </template>
              </UPopover>
              <UInputTime v-model="paidAtTime" :hour-cycle="24" class="w-1/2" />
              <UButton
                v-if="state.paid_at"
                type="button"
                icon="i-mdi-close"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="clearPaidAt"
              />
            </div>
          </div>
        </UFormField>

        <UFormField name="notes" :label="t('registration.notes')">
          <UTextarea v-model="state.notes" class="w-full" :rows="3" />
        </UFormField>

        <USeparator />

        <p class="text-sm font-semibold text-highlighted">
          {{ t('registration.liveManagement') }}
        </p>

        <div class="flex gap-4">
          <UFormField name="arrived" :label="t('registration.arrived')" class="flex-1">
            <UButton
              type="button"
              :icon="state.arrived ? 'i-mdi-check-circle' : 'i-mdi-circle-outline'"
              :variant="state.arrived ? 'solid' : 'outline'"
              :color="state.arrived ? 'primary' : 'neutral'"
              size="sm"
              class="w-full"
              @click="state.arrived = !state.arrived"
            />
          </UFormField>

          <UFormField name="weight_in" :label="t('registration.weightIn')" class="flex-1">
            <div class="flex items-center gap-2">
              <UInput
                :model-value="state.weight_in !== null ? String(state.weight_in) : ''"
                type="number"
                step="0.1"
                min="0"
                class="w-full"
                @update:model-value="(v: string) => state.weight_in = v === '' ? null : Number(v)"
              />
              <UButton
                v-if="state.weight_in !== null"
                type="button"
                icon="i-mdi-close"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="state.weight_in = null"
              />
            </div>
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
import type { Registration } from '~/types/models'
import { CalendarDate, parseDate, parseTime, Time } from '@internationalized/date'
import * as z from 'zod'

const props = defineProps<{
  item: Registration | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const open = defineModel<boolean>({ default: false })
const { t } = useI18n()
const api = useApi()
const toast = useToast()

const isEdit = computed(() => props.item !== null)

const schema = z.object({
  athlete_id: z.string().min(1),
  tournament_id: z.string().min(1),
  discipline_id: z.string().min(1),
  weight_category_id: z.string().min(1),
  paid_at: z.string().nullable().optional(),
  arrived: z.boolean().optional(),
  weight_in: z.number().nullable().optional(),
  notes: z.string().optional(),
})

const state = reactive({
  athlete_id: null as string | null,
  tournament_id: null as string | null,
  discipline_id: null as string | null,
  weight_category_id: null as string | null,
  paid_at: null as string | null,
  arrived: false,
  weight_in: null as number | null,
  notes: '',
})

const paidAtOpen = ref(false)
const paidAtDate = ref<any>()
const paidAtTime = ref<any>()

let ignoreNextPaidAt = false

watch(() => state.paid_at, (val) => {
  ignoreNextPaidAt = true
  if (!val) {
    paidAtDate.value = undefined
    paidAtTime.value = undefined
  } else {
    const [datePart, timePart] = val.split('T')
    paidAtDate.value = datePart ? parseDate(datePart) : undefined
    paidAtTime.value = timePart ? parseTime(timePart.length === 5 ? `${timePart}:00` : timePart) : undefined
  }
  nextTick(() => { ignoreNextPaidAt = false })
}, { immediate: true })

watch([paidAtDate, paidAtTime], ([date, time]) => {
  if (ignoreNextPaidAt) { return }
  if (!date) {
    state.paid_at = null
    return
  }
  const d = `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
  const tStr = time
    ? `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`
    : '00:00'
  state.paid_at = `${d}T${tStr}`
})

function setPaidAtNow() {
  const now = new Date()
  paidAtDate.value = new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
  paidAtTime.value = new Time(now.getHours(), now.getMinutes(), now.getSeconds())
}

function clearPaidAt() {
  paidAtDate.value = undefined
  paidAtTime.value = undefined
}

watch(open, (val) => {
  if (val) {
    state.athlete_id = props.item?.athlete_id ?? null
    state.tournament_id = props.item?.tournament_id ?? null
    state.discipline_id = props.item?.discipline_id ?? null
    state.weight_category_id = props.item?.weight_category_id ?? null
    state.paid_at = serverDateToInput(props.item?.paid_at) || null
    state.arrived = props.item?.arrived ?? false
    state.weight_in = props.item?.weight_in ?? null
    state.notes = props.item?.notes ?? ''
  }
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<z.infer<typeof schema>>) {
  loading.value = true
  try {
    const body = {
      athlete_id: state.athlete_id,
      tournament_id: state.tournament_id,
      discipline_id: event.data.discipline_id,
      weight_category_id: event.data.weight_category_id,
      paid_at: inputDateToServer(event.data.paid_at),
      arrived: event.data.arrived ?? false,
      weight_in: event.data.weight_in ?? null,
      notes: event.data.notes || null,
    }
    if (isEdit.value) {
      await api.put(`/api/admin/registrations/${props.item!.id}`, body)
    } else {
      await api.post('/api/admin/registrations', body)
    }

    open.value = false
    emit('saved')
    toast.add({
      title: isEdit.value ? t('registration.updated') : t('registration.created'),
      color: 'success',
    })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>
