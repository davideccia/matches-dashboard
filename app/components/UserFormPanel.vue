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

        <UFormField v-if="canEditSuperadmin" name="superadmin" :label="t('user.superadmin')">
          <USwitch v-model="state.superadmin" />
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

const canEditEmail = computed(() =>
  !!currentUser.value?.superadmin || currentUser.value?.id === props.user?.id,
)
const canEditSuperadmin = computed(() => !!currentUser.value?.superadmin)

const isEdit = computed(() => props.user !== null)

const createSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  superadmin: z.boolean().optional(),
})

const editSchema = z.object({
  email: z.email(),
  password: z.union([z.string().min(6), z.literal('')]),
  superadmin: z.boolean().optional(),
})

const schema = computed(() => isEdit.value ? editSchema : createSchema)

const state = reactive({
  email: '',
  password: '',
  superadmin: false,
})

watch(open, (val) => {
  if (val) {
    state.email = props.user?.email ?? ''
    state.password = ''
    state.superadmin = props.user?.superadmin ?? false
  }
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<{ email: string, password: string, superadmin?: boolean }>) {
  loading.value = true
  try {
    const body: Record<string, unknown> = {}
    if (canEditEmail.value) { body.email = event.data.email }
    if (event.data.password) { body.password = event.data.password }
    if (canEditSuperadmin.value) { body.superadmin = event.data.superadmin }

    if (isEdit.value) {
      await api.put(`/api/admin/users/${props.user!.id}`, body)
    } else {
      body.email = event.data.email
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
