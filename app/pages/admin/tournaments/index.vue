<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('nav.tournaments')">
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
        <OrphanRegistrationsAlert :items="[]" skeleton />
        <DataTable
          ref="tableRef"
          url="/api/admin/tournaments"
          :columns="columns"
          empty-icon="i-mdi-trophy"
        >
          <template #date-cell="{ row }">
            {{ formatServerDateOnly(((row.original as unknown as Tournament)).date, locale) }}
          </template>
          <template #status-cell="{ row }">
            <UBadge
              :color="statusBadgeColor((row.original as unknown as Tournament).status)"
              variant="subtle"
            >
              <span
                v-if="isPulsing((row.original as unknown as Tournament).status)"
                class="size-1.5 rounded-full bg-current animate-pulse"
              />
              {{ tournamentStatusLabel((row.original as unknown as Tournament).status) }}
            </UBadge>
          </template>
          <template #actions-cell="{ row }">
            <div class="flex justify-end gap-1">
              <UDropdownMenu :items="getPdfMenuItems((row.original as unknown as Tournament))">
                <UButton
                  icon="i-mdi-file-download-outline"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                />
              </UDropdownMenu>
              <UButton
                icon="i-mdi-pencil"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="openEdit((row.original as unknown as Tournament))"
              />
              <UButton
                icon="i-mdi-delete"
                variant="ghost"
                color="error"
                size="sm"
                @click="confirmDelete((row.original as unknown as Tournament))"
              />
            </div>
          </template>
        </DataTable>
      </div>
    </template>
  </UDashboardPanel>

  <ClientOnly>
    <TournamentFormPanel v-model="panelOpen" :item="editingItem" @saved="() => tableRef?.refresh()" />

    <UModal v-model:open="confirmOpen" :title="t('common.confirm')">
      <template #body>
        <p class="text-sm text-muted">
          {{ t('tournament.deleteConfirm') }}
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
import type { BadgeProps, TableColumn } from '@nuxt/ui'
import type { Tournament } from '~/types/models'

definePageMeta({ layout: 'default' })

const { t, locale } = useI18n()
const api = useApi()
const toast = useToast()

const tableRef = useTemplateRef('tableRef')

const panelOpen = ref(false)
const editingItem = ref<Tournament | null>(null)
const confirmOpen = ref(false)
const deleteTarget = ref<Tournament | null>(null)
const deleting = ref(false)

const STATUS_COLORS: Record<string, BadgeProps['color']> = {
  scheduled: 'neutral',
  registrations_opened: 'info',
  registrations_closed: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
}
const PULSING_STATUSES = new Set(['registrations_opened', 'in_progress'])

function statusBadgeColor(status: string): BadgeProps['color'] {
  return STATUS_COLORS[status] ?? 'neutral'
}

function isPulsing(status: string): boolean {
  return PULSING_STATUSES.has(status)
}

function tournamentStatusLabel(status: string): string {
  if (status === 'scheduled') { return t('tournament.status.scheduled') }
  if (status === 'registrations_opened') { return t('tournament.status.registrations_opened') }
  if (status === 'registrations_closed') { return t('tournament.status.registrations_closed') }
  if (status === 'in_progress') { return t('tournament.status.in_progress') }
  if (status === 'completed') { return t('tournament.status.completed') }
  if (status === 'cancelled') { return t('tournament.status.cancelled') }
  return status
}

const columns = computed(() => [
  { accessorKey: 'name', header: t('tournament.name') },
  { accessorKey: 'date', header: t('tournament.date') },
  { accessorKey: 'location_city', header: t('tournament.city') },
  { accessorKey: 'status', header: t('tournament.status.label') },
  { id: 'actions', header: '' },
] as TableColumn<Record<string, unknown>>[])

async function downloadSimplePdf(item: Tournament) {
  try {
    await api.download(`/api/admin/tournaments/${item.id}/match_records/pdf/?type=simple`, `tournament-${item.id}-matches-list.pdf`)
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  }
}

async function downloadDetailedPdf(item: Tournament) {
  try {
    await api.download(`/api/admin/tournaments/${item.id}/match_records/pdf/?type=detailed`, `tournament-${item.id}-matches.pdf`)
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  }
}

function getPdfMenuItems(item: Tournament) {
  return [
    [
      { label: t('tournament.pdf.list'), icon: 'i-mdi-format-list-bulleted', onSelect: () => downloadSimplePdf(item) },
      { label: t('tournament.pdf.board'), icon: 'i-mdi-view-list', onSelect: () => downloadDetailedPdf(item) },
    ],
  ]
}

function openCreate() {
  editingItem.value = null
  panelOpen.value = true
}

function openEdit(item: Tournament) {
  editingItem.value = item
  panelOpen.value = true
}

function confirmDelete(item: Tournament) {
  deleteTarget.value = item
  confirmOpen.value = true
}

async function deleteItem() {
  if (!deleteTarget.value) { return }
  deleting.value = true
  try {
    await api.del(`/api/admin/tournaments/${deleteTarget.value.id}`)
    confirmOpen.value = false
    deleteTarget.value = null
    await tableRef.value?.refresh()
    toast.add({ title: t('tournament.deleted'), color: 'success' })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>
