<template>
  <USlideover v-model:open="open" :title="isEdit ? t('athlete.editTitle') : t('athlete.createTitle')">
    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-6 p-6" @submit="onSubmit">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField name="first_name" :label="t('athlete.firstName')" required>
            <UInput v-model="state.first_name" class="w-full" />
          </UFormField>

          <UFormField name="last_name" :label="t('athlete.lastName')" required>
            <UInput v-model="state.last_name" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField name="birth_date" :label="t('athlete.birthDate')" required>
            <UInput v-model="state.birth_date" type="date" class="w-full" />
          </UFormField>

          <UFormField name="gender" :label="t('athlete.gender.label')" required>
            <USelect v-model="state.gender" :items="genderOptions" class="w-full" />
          </UFormField>
        </div>

        <UFormField name="tax_number" :label="t('athlete.taxNumber')" required>
          <UInput v-model="state.tax_number" class="w-full" />
        </UFormField>

        <UFormField name="team_name" :label="t('athlete.teamName')">
          <UInput v-model="state.team_name" class="w-full" />
        </UFormField>

        <UFormField name="default_weight_category_id" :label="t('athlete.defaultWeightCategory')">
          <div class="flex items-center gap-2">
            <ApiSelectMenu
              v-model="state.default_weight_category_id"
              endpoint="/api/admin/weight_categories"
              label-key="label"
              :placeholder="t('athlete.noCategory')"
              class="w-full"
            />
            <UButton
              v-if="state.default_weight_category_id !== null"
              type="button"
              icon="i-mdi-close"
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-label="t('common.cancel')"
              @click="state.default_weight_category_id = null"
            />
          </div>
        </UFormField>

        <UFormField name="default_discipline_id" :label="t('athlete.defaultDiscipline')">
          <div class="flex items-center gap-2">
            <ApiSelectMenu
              v-model="state.default_discipline_id"
              endpoint="/api/admin/disciplines"
              label-key="label"
              :placeholder="t('athlete.noCategory')"
              class="w-full"
            />
            <UButton
              v-if="state.default_discipline_id !== null"
              type="button"
              icon="i-mdi-close"
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-label="t('common.cancel')"
              @click="state.default_discipline_id = null"
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
  default_weight_category_id: z.string().nullish(),
  default_discipline_id: z.string().nullish(),
})

const state = reactive({
  first_name: '',
  last_name: '',
  birth_date: '',
  gender: 'male' as Gender,
  tax_number: '',
  team_name: '',
  default_weight_category_id: null as string | null,
  default_discipline_id: null as string | null,
})

watch(open, (val) => {
  if (val) {
    state.first_name = props.item?.first_name ?? ''
    state.last_name = props.item?.last_name ?? ''
    state.birth_date = props.item?.birth_date?.slice(0, 10) ?? ''
    state.gender = props.item?.gender ?? 'male'
    state.tax_number = props.item?.tax_number ?? ''
    state.team_name = props.item?.team_name ?? ''
    state.default_weight_category_id = props.item?.default_weight_category_id ?? null
    state.default_discipline_id = props.item?.default_discipline_id ?? null
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
      default_weight_category_id: event.data.default_weight_category_id || null,
      default_discipline_id: event.data.default_discipline_id || null,
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
