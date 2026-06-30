<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('nav.weightCategories')">
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
      <div class="flex flex-col gap-5 p-6 max-w-screen-2xl mx-auto w-full">
        <DataTable
          ref="tableRef"
          url="/api/admin/weight_categories"
          :columns="columns"
          empty-icon="i-mdi-scale-balance"
          :bulk-actions="[{ endpoint: '/api/admin/weight_categories/bulk', method: 'DELETE', icon: 'i-mdi-delete', label: t('common.delete'), ids_key: 'ids', color: 'error' }]"
        >
          <template #actions-cell="{ row }">
            <div class="flex justify-end gap-1">
              <UButton
                icon="i-mdi-pencil"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="openEdit((row.original as unknown as WeightCategory))"
              />
              <UButton
                icon="i-mdi-delete"
                variant="ghost"
                color="error"
                size="sm"
                @click="confirmDelete((row.original as unknown as WeightCategory))"
              />
            </div>
          </template>
        </DataTable>
      </div>
    </template>
  </UDashboardPanel>

  <ClientOnly>
    <WeightCategoryFormPanel v-model="panelOpen" :item="editingItem" @saved="() => tableRef?.refresh()" />

    <UModal v-model:open="confirmOpen" :title="t('common.confirm')">
      <template #body>
        <p class="text-sm text-muted">
          {{ t('weightCategory.deleteConfirm') }}
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
import type { WeightCategory } from '~/types/models'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const api = useApi()
const toast = useToast()

const tableRef = useTemplateRef('tableRef')

const panelOpen = ref(false)
const editingItem = ref<WeightCategory | null>(null)
const confirmOpen = ref(false)
const deleteTarget = ref<WeightCategory | null>(null)
const deleting = ref(false)

const columns = computed(() => [
  { accessorKey: 'label', header: t('weightCategory.label') },
  { accessorKey: 'value', header: t('weightCategory.value'), meta: { class: { th: 'text-right', td: 'text-right' } } },
  { id: 'actions', header: '' },
] as TableColumn<Record<string, unknown>>[])

function openCreate() {
  editingItem.value = null
  panelOpen.value = true
}

function openEdit(item: WeightCategory) {
  editingItem.value = item
  panelOpen.value = true
}

function confirmDelete(item: WeightCategory) {
  deleteTarget.value = item
  confirmOpen.value = true
}

async function deleteItem() {
  if (!deleteTarget.value) { return }
  deleting.value = true
  try {
    await api.del(`/api/admin/weight_categories/${deleteTarget.value.id}`)
    confirmOpen.value = false
    deleteTarget.value = null
    await tableRef.value?.refresh()
    toast.add({ title: t('weightCategory.deleted'), color: 'success' })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>
