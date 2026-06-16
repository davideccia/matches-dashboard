<template>
  <USlideover v-model:open="open" :title="isEdit ? t('weightCategory.editTitle') : t('weightCategory.createTitle')">
    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-6 p-6" @submit="onSubmit">
        <UFormField name="label" :label="t('weightCategory.label')" required>
          <UInput v-model="state.label" class="w-full" />
        </UFormField>

        <UFormField name="value" :label="t('weightCategory.value')" required>
          <UInput v-model="state.value" type="number" step="0.1" class="w-full" />
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
import type { WeightCategory } from '~/types/models'
import * as z from 'zod'

const props = defineProps<{
  item: WeightCategory | null
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
  label: z.string().min(1),
  value: z.coerce.number().positive(),
})

const state = reactive({
  label: '',
  value: '' as unknown as number,
})

watch(open, (val) => {
  if (val) {
    state.label = props.item?.label ?? ''
    state.value = props.item?.value ?? ('' as unknown as number)
  }
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<z.infer<typeof schema>>) {
  loading.value = true
  try {
    const body = { label: event.data.label, value: event.data.value }

    if (isEdit.value) {
      await api.put(`/api/admin/weight_categories/${props.item!.id}`, body)
    } else {
      await api.post('/api/admin/weight_categories', body)
    }

    open.value = false
    emit('saved')
    toast.add({
      title: isEdit.value ? t('weightCategory.updated') : t('weightCategory.created'),
      color: 'success',
    })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>
