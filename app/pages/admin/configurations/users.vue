<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('nav.users')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template v-if="currentUser?.superadmin" #right>
          <UButton icon="i-mdi-plus" @click="openCreate">
            {{ t('common.add') }}
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-5 p-6 max-w-screen-2xl mx-auto w-full">
        <DataTable
          ref="tableRef"
          url="/api/admin/users"
          :columns="columns"
          empty-icon="i-mdi-account-group"
          :bulk-actions="[{ endpoint: '/api/admin/users/bulk', method: 'DELETE', icon: 'i-mdi-delete', label: t('common.delete'), ids_key: 'ids', color: 'error' }]"
        >
          <template #created_at-cell="{ row }">
            {{ formatServerDate(((row.original as unknown as User)).created_at, locale) }}
          </template>
          <template #actions-cell="{ row }">
            <div class="flex justify-end gap-1">
              <UButton
                v-if="currentUser?.superadmin || ((row.original as unknown as User)).id === currentUser?.id"
                icon="i-mdi-pencil"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="openEdit((row.original as unknown as User))"
              />
              <UButton
                v-if="currentUser?.superadmin && ((row.original as unknown as User)).id !== currentUser?.id"
                icon="i-mdi-delete"
                variant="ghost"
                color="error"
                size="sm"
                @click="confirmDelete((row.original as unknown as User))"
              />
            </div>
          </template>
        </DataTable>
      </div>
    </template>
  </UDashboardPanel>

  <ClientOnly>
    <UserFormPanel v-model="panelOpen" :user="editingUser" @saved="() => tableRef?.refresh()" />

    <UModal v-model:open="confirmOpen" :title="t('common.confirm')">
      <template #body>
        <p class="text-sm text-muted">
          {{ t('user.deleteConfirm') }}
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="confirmOpen = false">
            {{ t('common.cancel') }}
          </UButton>
          <UButton color="error" :loading="deleting" @click="deleteUser">
            {{ t('common.delete') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { User } from '~/types/models'

definePageMeta({ layout: 'default' })

const { t, locale } = useI18n()
const api = useApi()
const toast = useToast()
const { user: currentUser } = useAuth()

const tableRef = useTemplateRef('tableRef')

const panelOpen = ref(false)
const editingUser = ref<User | null>(null)
const confirmOpen = ref(false)
const deleteTarget = ref<User | null>(null)
const deleting = ref(false)

const columns = computed(() => [
  { accessorKey: 'email', header: t('user.email') },
  { accessorKey: 'created_at', header: t('user.createdAt') },
  { id: 'actions', header: '' },
] as TableColumn<Record<string, unknown>>[])

function openCreate() {
  editingUser.value = null
  panelOpen.value = true
}

function openEdit(user: User) {
  editingUser.value = user
  panelOpen.value = true
}

function confirmDelete(user: User) {
  deleteTarget.value = user
  confirmOpen.value = true
}

async function deleteUser() {
  if (!deleteTarget.value) { return }
  deleting.value = true
  try {
    await api.del(`/api/admin/users/${deleteTarget.value.id}`)
    confirmOpen.value = false
    deleteTarget.value = null
    await tableRef.value?.refresh()
    toast.add({ title: t('user.deleted'), color: 'success' })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>
