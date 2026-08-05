<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('nav.experienceTiers')">
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
        <UAlert
          color="neutral"
          variant="subtle"
          icon="i-lucide-info"
          :description="t('experienceTier.globalHint')"
        />

        <DataTable
          ref="tableRef"
          url="/api/admin/experience_tiers"
          :columns="columns"
          :params="{ only_global: 1 }"
          empty-icon="i-mdi-stairs"
          :bulk-actions="[{ endpoint: '/api/admin/experience_tiers/bulk', method: 'DELETE', icon: 'i-mdi-delete', label: t('common.delete'), ids_key: 'ids', color: 'error' }]"
        >
          <template #range-cell="{ row }">
            <span class="tabular-nums">
              {{ formatTierRange((row.original as unknown as ExperienceTier).min_match_count, (row.original as unknown as ExperienceTier).max_match_count) }}
            </span>
          </template>
          <template #enabled-cell="{ row }">
            <UBadge
              :color="(row.original as unknown as ExperienceTier).enabled ? 'success' : 'neutral'"
              variant="subtle"
              :icon="(row.original as unknown as ExperienceTier).enabled ? 'i-lucide-circle-check' : 'i-lucide-circle-slash'"
            >
              {{ (row.original as unknown as ExperienceTier).enabled ? t('experienceTier.active') : t('experienceTier.inactive') }}
            </UBadge>
          </template>
          <template #actions-cell="{ row }">
            <div class="flex justify-end gap-1">
              <UButton
                icon="i-mdi-pencil"
                variant="ghost"
                color="neutral"
                size="sm"
                :aria-label="t('common.edit')"
                @click="openEdit((row.original as unknown as ExperienceTier))"
              />
              <UButton
                icon="i-mdi-delete"
                variant="ghost"
                color="error"
                size="sm"
                :aria-label="t('common.delete')"
                @click="confirmDelete((row.original as unknown as ExperienceTier))"
              />
            </div>
          </template>
        </DataTable>
      </div>
    </template>
  </UDashboardPanel>

  <ClientOnly>
    <ExperienceTierFormPanel v-model="panelOpen" :item="editingItem" @saved="() => tableRef?.refresh()" />

    <UModal v-model:open="confirmOpen" :title="t('common.confirm')">
      <template #body>
        <p class="text-sm text-muted">
          {{ t('experienceTier.deleteConfirm') }}
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="() => { confirmOpen = false }">
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
import type { ExperienceTier } from '~/types/models'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const api = useApi()
const toast = useToast()

const tableRef = useTemplateRef('tableRef')

const panelOpen = ref(false)
const editingItem = ref<ExperienceTier | null>(null)
const confirmOpen = ref(false)
const deleteTarget = ref<ExperienceTier | null>(null)
const deleting = ref(false)

const columns = computed(() => [
  { accessorKey: 'label', header: t('experienceTier.label') },
  { id: 'range', header: t('experienceTier.range'), meta: { class: { th: 'text-right', td: 'text-right' } } },
  { accessorKey: 'enabled', header: t('experienceTier.enabled') },
  { id: 'actions', header: '' },
] as TableColumn<Record<string, unknown>>[])

function openCreate() {
  editingItem.value = null
  panelOpen.value = true
}

function openEdit(item: ExperienceTier) {
  editingItem.value = item
  panelOpen.value = true
}

function confirmDelete(item: ExperienceTier) {
  deleteTarget.value = item
  confirmOpen.value = true
}

async function deleteItem() {
  if (!deleteTarget.value) { return }
  deleting.value = true
  try {
    await api.del(`/api/admin/experience_tiers/${deleteTarget.value.id}`)
    confirmOpen.value = false
    deleteTarget.value = null
    await tableRef.value?.refresh()
    toast.add({ title: t('experienceTier.deleted'), color: 'success' })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>
