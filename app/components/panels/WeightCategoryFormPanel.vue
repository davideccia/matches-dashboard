<template>
  <USlideover v-model:open="open" :title="isEdit ? t('weightCategory.editTitle') : t('weightCategory.createTitle')" :ui="{ content: 'w-2/5 max-w-2xl' }">
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

const fetching = ref(false)

watch(open, async (val) => {
  if (!val) { return }
  if (isEdit.value) {
    fetching.value = true
    try {
      const { data: item } = await api.get<{ data: WeightCategory }>(`/api/admin/weight_categories/${props.item!.id}`)
      state.label = item.label
      state.value = item.value
    } catch (e) {
      toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
      open.value = false
    } finally {
      fetching.value = false
    }
  } else {
    state.label = ''
    state.value = '' as unknown as number
  }
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<z.infer<typeof schema>>) {
  loading.value = true
  try {
    const body = { label: event.data.label, value: event.data.value }

    let saved: WeightCategory
    if (isEdit.value) {
      const { data } = await api.put<{ data: WeightCategory }>(`/api/admin/weight_categories/${props.item!.id}`, body)
      saved = data
    } else {
      const { data } = await api.post<{ data: WeightCategory }>('/api/admin/weight_categories', body)
      saved = data
    }

    state.label = saved.label
    state.value = saved.value

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
