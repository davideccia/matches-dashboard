<template>
  <USlideover
    v-model:open="open"
    :title="isEdit ? t('user.editTitle') : t('user.createTitle')"
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
        <UFormField name="username" :label="t('user.username')" required>
          <UInput
            v-model="state.username"
            class="w-full"
            autocomplete="off"
          />
        </UFormField>

        <UFormField name="email" :label="t('user.email')" required>
          <UInput
            v-model="state.email"
            type="email"
            class="w-full"
            autocomplete="off"
            :disabled="!canEditEmail"
          />
        </UFormField>

        <UFormField v-if="currentUser?.superadmin" name="superadmin" :label="t('user.superadmin')">
          <USwitch v-model="state.superadmin" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton variant="ghost" color="neutral" type="button" @click="() => { open = false }">
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

const canEditEmail = computed(() => currentUser.value?.superadmin || currentUser.value?.id === props.user?.id)

const isEdit = computed(() => props.user !== null)

const schema = z.object({
  username: z.string().min(1),
  email: z.email(),
  superadmin: z.boolean().optional(),
})

const state = reactive({
  username: '',
  email: '',
  superadmin: false,
})

const fetching = ref(false)

watch(open, async (val) => {
  if (!val) { return }
  if (isEdit.value) {
    fetching.value = true
    try {
      const { data: user } = await api.get<{ data: User }>(`/api/admin/users/${props.user!.id}`)
      state.username = user.username
      state.email = user.email
      state.superadmin = user.superadmin
    } catch (e) {
      toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
      open.value = false
    } finally {
      fetching.value = false
    }
  } else {
    state.username = ''
    state.email = ''
  }
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<z.infer<typeof schema>>) {
  loading.value = true
  try {
    const body: Record<string, unknown> = {
      username: event.data.username,
      email: event.data.email,
    }
    if (currentUser.value?.superadmin) { body.superadmin = event.data.superadmin }

    let saved: User
    if (isEdit.value) {
      const { data } = await api.put<{ data: User }>(`/api/admin/users/${props.user!.id}`, body)
      saved = data
    } else {
      const { data } = await api.post<{ data: User }>('/api/admin/users', body)
      saved = data
    }

    state.username = saved.username
    state.email = saved.email
    state.superadmin = saved.superadmin

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
