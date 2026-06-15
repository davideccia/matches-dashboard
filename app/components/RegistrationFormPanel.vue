<template>
  <USlideover v-model:open="open" :title="isEdit ? t('registration.editTitle') : t('registration.createTitle')">
    <template #body>
      <UForm :schema="schema" :state="state as any" class="space-y-6 p-6" @submit="(e: any) => onSubmit(e)">
        <template v-if="!isEdit">
          <UFormField name="athleteId" :label="t('registration.athlete')" required>
            <div class="flex items-center gap-2">
              <ApiSelectMenu
                v-model="state.athleteId"
                endpoint="/api/desktop/athletes"
                label-key="fullName"
                :placeholder="t('registration.selectAthlete')"
                class="w-full"
              />
              <UButton
                v-if="state.athleteId !== null"
                type="button"
                icon="i-mdi-close"
                variant="ghost"
                color="neutral"
                size="sm"
                :aria-label="t('common.cancel')"
                @click="state.athleteId = null"
              />
            </div>
          </UFormField>

          <UFormField name="tournamentId" :label="t('registration.tournament')" required>
            <div class="flex items-center gap-2">
              <ApiSelectMenu
                v-model="state.tournamentId"
                endpoint="/api/desktop/tournaments"
                label-key="name"
                :placeholder="t('registration.selectTournament')"
                class="w-full"
              />
              <UButton
                v-if="state.tournamentId !== null"
                type="button"
                icon="i-mdi-close"
                variant="ghost"
                color="neutral"
                size="sm"
                :aria-label="t('common.cancel')"
                @click="state.tournamentId = null"
              />
            </div>
          </UFormField>
        </template>

        <UFormField name="disciplineId" :label="t('registration.discipline')" required>
          <div class="flex items-center gap-2">
            <ApiSelectMenu
              v-model="state.disciplineId"
              endpoint="/api/desktop/disciplines"
              label-key="label"
              :placeholder="t('registration.selectDiscipline')"
              class="w-full"
            />
            <UButton
              v-if="state.disciplineId !== null"
              type="button"
              icon="i-mdi-close"
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-label="t('common.cancel')"
              @click="state.disciplineId = null"
            />
          </div>
        </UFormField>

        <UFormField name="weightCategoryId" :label="t('registration.weightCategory')" required>
          <div class="flex items-center gap-2">
            <ApiSelectMenu
              v-model="state.weightCategoryId"
              endpoint="/api/desktop/weight_categories"
              label-key="label"
              :placeholder="t('registration.selectWeightCategory')"
              class="w-full"
            />
            <UButton
              v-if="state.weightCategoryId !== null"
              type="button"
              icon="i-mdi-close"
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-label="t('common.cancel')"
              @click="state.weightCategoryId = null"
            />
          </div>
        </UFormField>

        <UFormField name="paidAt" :label="t('registration.paidAt')">
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
                v-if="state.paidAt"
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

          <UFormField name="weightIn" :label="t('registration.weightIn')" class="flex-1">
            <div class="flex items-center gap-2">
              <UInput
                :model-value="state.weightIn !== null ? String(state.weightIn) : ''"
                type="number"
                step="0.1"
                min="0"
                class="w-full"
                @update:model-value="(v: string) => state.weightIn = v === '' ? null : Number(v)"
              />
              <UButton
                v-if="state.weightIn !== null"
                type="button"
                icon="i-mdi-close"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="state.weightIn = null"
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

const createSchema = z.object({
  athleteId: z.string().min(1),
  tournamentId: z.string().min(1),
  disciplineId: z.string().min(1),
  weightCategoryId: z.string().min(1),
  paidAt: z.string().nullable().optional(),
  arrived: z.boolean().optional(),
  weightIn: z.number().nullable().optional(),
  notes: z.string().optional(),
})

const editSchema = z.object({
  disciplineId: z.string().min(1),
  weightCategoryId: z.string().min(1),
  paidAt: z.string().nullable().optional(),
  arrived: z.boolean().optional(),
  weightIn: z.number().nullable().optional(),
  notes: z.string().optional(),
})

const schema = computed(() => isEdit.value ? editSchema : createSchema)

const state = reactive({
  athleteId: null as string | null,
  tournamentId: null as string | null,
  disciplineId: null as string | null,
  weightCategoryId: null as string | null,
  paidAt: null as string | null,
  arrived: false,
  weightIn: null as number | null,
  notes: '',
})

const paidAtOpen = ref(false)
const paidAtDate = ref<any>()
const paidAtTime = ref<any>()

let ignoreNextPaidAt = false

watch(() => state.paidAt, (val) => {
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
    state.paidAt = null
    return
  }
  const d = `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
  const tStr = time
    ? `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`
    : '00:00'
  state.paidAt = `${d}T${tStr}`
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
    state.athleteId = props.item?.athleteId ?? null
    state.tournamentId = props.item?.tournamentId ?? null
    state.disciplineId = props.item?.disciplineId ?? null
    state.weightCategoryId = props.item?.weightCategoryId ?? null
    state.paidAt = serverDateToInput(props.item?.paidAt) || null
    state.arrived = props.item?.arrived ?? false
    state.weightIn = props.item?.weightIn ?? null
    state.notes = props.item?.notes ?? ''
  }
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<z.infer<typeof createSchema>>) {
  loading.value = true
  try {
    if (isEdit.value) {
      const body = {
        disciplineId: event.data.disciplineId,
        weightCategoryId: event.data.weightCategoryId,
        paidAt: inputDateToServer(event.data.paidAt),
        arrived: event.data.arrived ?? false,
        weightIn: event.data.weightIn ?? null,
        notes: event.data.notes || null,
      }
      await api.put(`/api/desktop/registrations/${props.item!.id}`, body)
    } else {
      const body = {
        athleteId: event.data.athleteId,
        tournamentId: event.data.tournamentId,
        disciplineId: event.data.disciplineId,
        weightCategoryId: event.data.weightCategoryId,
        paidAt: inputDateToServer(event.data.paidAt),
        arrived: event.data.arrived ?? false,
        weightIn: event.data.weightIn ?? null,
        notes: event.data.notes || null,
      }
      await api.post('/api/desktop/registrations', body)
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
