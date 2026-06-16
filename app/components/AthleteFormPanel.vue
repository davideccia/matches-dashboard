<template>
  <USlideover v-model:open="open" :title="isEdit ? t('athlete.editTitle') : t('athlete.createTitle')">
    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-6 p-6" @submit="onSubmit">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField name="firstName" :label="t('athlete.firstName')" required>
            <UInput v-model="state.firstName" class="w-full" />
          </UFormField>

          <UFormField name="lastName" :label="t('athlete.lastName')" required>
            <UInput v-model="state.lastName" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField name="birthDate" :label="t('athlete.birthDate')" required>
            <UInput v-model="state.birthDate" type="date" class="w-full" />
          </UFormField>

          <UFormField name="gender" :label="t('athlete.gender.label')" required>
            <USelect v-model="state.gender" :items="genderOptions" class="w-full" />
          </UFormField>
        </div>

        <UFormField name="taxNumber" :label="t('athlete.taxNumber')" required>
          <UInput v-model="state.taxNumber" class="w-full" />
        </UFormField>

        <UFormField name="teamName" :label="t('athlete.teamName')">
          <UInput v-model="state.teamName" class="w-full" />
        </UFormField>

        <UFormField name="defaultWeightCategoryId" :label="t('athlete.defaultWeightCategory')">
          <div class="flex items-center gap-2">
            <ApiSelectMenu
              v-model="state.defaultWeightCategoryId"
              endpoint="/api/admin/weight_categories"
              label-key="label"
              :placeholder="t('athlete.noCategory')"
              class="w-full"
            />
            <UButton
              v-if="state.defaultWeightCategoryId !== null"
              type="button"
              icon="i-mdi-close"
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-label="t('common.cancel')"
              @click="state.defaultWeightCategoryId = null"
            />
          </div>
        </UFormField>

        <UFormField name="defaultDisciplineId" :label="t('athlete.defaultDiscipline')">
          <div class="flex items-center gap-2">
            <ApiSelectMenu
              v-model="state.defaultDisciplineId"
              endpoint="/api/admin/disciplines"
              label-key="label"
              :placeholder="t('athlete.noCategory')"
              class="w-full"
            />
            <UButton
              v-if="state.defaultDisciplineId !== null"
              type="button"
              icon="i-mdi-close"
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-label="t('common.cancel')"
              @click="state.defaultDisciplineId = null"
            />
          </div>
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
  { label: t('athlete.gender.MALE'), value: 'MALE' },
  { label: t('athlete.gender.FEMALE'), value: 'FEMALE' },
])

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string().min(1),
  gender: z.enum(GENDERS),
  taxNumber: z.string().min(1),
  teamName: z.string().optional(),
  defaultWeightCategoryId: z.string().nullish(),
  defaultDisciplineId: z.string().nullish(),
})

const state = reactive({
  firstName: '',
  lastName: '',
  birthDate: '',
  gender: 'MALE' as Gender,
  taxNumber: '',
  teamName: '',
  defaultWeightCategoryId: null as string | null,
  defaultDisciplineId: null as string | null,
})

watch(open, (val) => {
  if (val) {
    state.firstName = props.item?.firstName ?? ''
    state.lastName = props.item?.lastName ?? ''
    state.birthDate = props.item?.birthDate ?? ''
    state.gender = props.item?.gender ?? 'MALE'
    state.taxNumber = props.item?.taxNumber ?? ''
    state.teamName = props.item?.teamName ?? ''
    state.defaultWeightCategoryId = props.item?.defaultWeightCategoryId ?? null
    state.defaultDisciplineId = props.item?.defaultDisciplineId ?? null
  }
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<z.infer<typeof schema>>) {
  loading.value = true
  try {
    const body = {
      firstName: event.data.firstName,
      lastName: event.data.lastName,
      birthDate: event.data.birthDate,
      gender: event.data.gender,
      taxNumber: event.data.taxNumber,
      teamName: event.data.teamName || null,
      defaultWeightCategoryId: event.data.defaultWeightCategoryId || null,
      defaultDisciplineId: event.data.defaultDisciplineId || null,
    }

    if (isEdit.value) {
      await api.put(`/api/admin/athletes/${props.item!.id}`, body)
    } else {
      await api.post('/api/admin/athletes', body)
    }

    open.value = false
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
