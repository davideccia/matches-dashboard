<template>
  <USlideover
    v-model:open="open"
    :title="isEdit ? t('user.editTitle') : t('user.createTitle')"
  >
    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-6 p-6" @submit="onSubmit">
        <UFormField name="email" :label="t('user.email')" required>
          <UInput
            v-model="state.email"
            type="email"
            class="w-full"
            autocomplete="off"
            :disabled="!canEditEmail"
          />
        </UFormField>

        <UFormField
          name="password"
          :label="t('user.password')"
          :required="!isEdit"
          :hint="isEdit ? t('user.passwordHint') : undefined"
        >
          <UInput
            v-model="state.password"
            type="password"
            class="w-full"
            autocomplete="new-password"
          />
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
import type { User } from '~/types/models'
import * as z from 'zod'

const props = defineProps<{
  user: User | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const open = defineModel<boolean>({ default: false })
const { t } = useI18n()
const api = useApi()
const toast = useToast()
const { user: currentUser } = useAuth()

const canEditEmail = computed(() => currentUser.value?.id === props.user?.id)

const isEdit = computed(() => props.user !== null)

const schema = z.object({
  email: z.email(),
  password: z.union([z.string().min(6), z.literal('')]),
})

const state = reactive({
  email: '',
  password: '',
})

watch(open, (val) => {
  if (val) {
    state.email = props.user?.email ?? ''
    state.password = ''
  }
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<z.infer<typeof schema>>) {
  loading.value = true
  try {
    const body: Record<string, unknown> = {
      email: event.data.email,
    }
    if (event.data.password) { body.password = event.data.password }

    if (isEdit.value) {
      await api.put(`/api/admin/users/${props.user!.id}`, body)
    } else {
      await api.post('/api/admin/users', body)
    }

    open.value = false
    emit('saved')
    toast.add({
      title: isEdit.value ? t('user.updated') : t('user.created'),
      color: 'success',
    })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>
