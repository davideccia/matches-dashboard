<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('nav.athletes')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-mdi-plus" @click="openCreate">
            {{ t('common.add') }}
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-5 p-6">
        <DataTable
          ref="tableRef"
          url="/api/desktop/athletes"
          :columns="columns"
          empty-icon="i-mdi-account"
        >
          <template #birthDate-cell="{ row }">
            {{ formatServerDateOnly(((row.original as unknown as Athlete)).birthDate, locale) }}
          </template>
          <template #gender-cell="{ row }">
            {{ genderLabel(((row.original as unknown as Athlete)).gender) }}
          </template>
          <template #actions-cell="{ row }">
            <div class="flex justify-end gap-1">
              <UButton
                icon="i-mdi-pencil"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="openEdit((row.original as unknown as Athlete))"
              />
              <UButton
                icon="i-mdi-delete"
                variant="ghost"
                color="error"
                size="sm"
                @click="confirmDelete((row.original as unknown as Athlete))"
              />
            </div>
          </template>
        </DataTable>
      </div>
    </template>
  </UDashboardPanel>

  <ClientOnly>
    <AthleteFormPanel v-model="panelOpen" :item="editingItem" @saved="() => tableRef?.refresh()" />

    <UModal v-model:open="confirmOpen" :title="t('common.confirm')">
      <template #body>
        <p class="text-sm text-muted">
          {{ t('athlete.deleteConfirm') }}
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="confirmOpen = false">
            {{ t('common.cancel') }}
          </UButton>
          <UButton color="error" :loading="deleting" @click="deleteItem">
            {{ t('common.delete') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Athlete } from '~/types/models'

definePageMeta({ layout: 'default' })

const { t, locale } = useI18n()
const api = useApi()
const toast = useToast()

const tableRef = useTemplateRef('tableRef')

const panelOpen = ref(false)
const editingItem = ref<Athlete | null>(null)
const confirmOpen = ref(false)
const deleteTarget = ref<Athlete | null>(null)
const deleting = ref(false)

function genderLabel(gender: string): string {
  if (gender === 'MALE') { return t('athlete.gender.MALE') }
  if (gender === 'FEMALE') { return t('athlete.gender.FEMALE') }
  return gender
}

const columns = computed(() => [
  { accessorKey: 'fullName', header: t('athlete.firstName') },
  { accessorKey: 'birthDate', header: t('athlete.birthDate') },
  { accessorKey: 'gender', header: t('athlete.gender.label') },
  { accessorKey: 'taxNumber', header: t('athlete.taxNumber') },
  { accessorKey: 'teamName', header: t('athlete.teamName') },
  { id: 'actions', header: '' },
] as TableColumn<Record<string, unknown>>[])

function openCreate() {
  editingItem.value = null
  panelOpen.value = true
}

function openEdit(item: Athlete) {
  editingItem.value = item
  panelOpen.value = true
}

function confirmDelete(item: Athlete) {
  deleteTarget.value = item
  confirmOpen.value = true
}

async function deleteItem() {
  if (!deleteTarget.value) { return }
  deleting.value = true
  try {
    await api.del(`/api/desktop/athletes/${deleteTarget.value.id}`)
    confirmOpen.value = false
    deleteTarget.value = null
    await tableRef.value?.refresh()
    toast.add({ title: t('athlete.deleted'), color: 'success' })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>
