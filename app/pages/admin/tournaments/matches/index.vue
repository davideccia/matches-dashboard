<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('nav.matches')">
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
          url="/api/desktop/matches"
          :columns="columns"
          :params="tableParams"
          empty-icon="i-mdi-sword-cross"
        >
          <template #filters>
            <ApiSelectMenu
              v-model="tournamentId"
              endpoint="/api/desktop/tournaments"
              label-key="name"
              :placeholder="t('match.selectTournament')"
              class="w-full sm:w-56"
            />
            <UButton
              v-if="tournamentId"
              icon="i-mdi-close"
              variant="ghost"
              color="neutral"
              :aria-label="t('common.cancel')"
              @click="tournamentId = null"
            />
          </template>
          <template #status-cell="{ row }">
            <div class="flex items-center gap-2">
              <span
                class="inline-block size-2.5 rounded-full shrink-0"
                :class="[
                  row.original.status === 'SCHEDULED' && 'bg-blue-400',
                  row.original.status === 'IN_PROGRESS' && 'bg-amber-400 animate-pulse',
                  row.original.status === 'COMPLETED' && 'bg-green-500',
                  row.original.status === 'CANCELLED' && 'bg-red-400',
                ]"
              />
              {{ matchStatusLabel(((row.original as unknown as Match)).status) }}
            </div>
          </template>
          <template #actions-cell="{ row }">
            <div class="flex justify-end gap-1">
              <UButton
                icon="i-mdi-pencil"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="openEdit((row.original as unknown as Match))"
              />
              <UButton
                icon="i-mdi-delete"
                variant="ghost"
                color="error"
                size="sm"
                @click="confirmDelete((row.original as unknown as Match))"
              />
            </div>
          </template>
        </DataTable>
      </div>
    </template>
  </UDashboardPanel>

  <ClientOnly>
    <MatchFormPanel v-model="panelOpen" :item="editingItem" @saved="() => tableRef?.refresh()" />

    <UModal v-model:open="confirmOpen" :title="t('common.confirm')">
      <template #body>
        <p class="text-sm text-muted">
          {{ t('match.deleteConfirm') }}
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
import type { Match } from '~/types/models'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const api = useApi()
const toast = useToast()

const tableRef = useTemplateRef('tableRef')

const tournamentId = ref<string | null>(null)
const panelOpen = ref(false)
const editingItem = ref<Match | null>(null)
const confirmOpen = ref(false)
const deleteTarget = ref<Match | null>(null)
const deleting = ref(false)

const tableParams = computed(() => ({
  tournamentId: tournamentId.value ?? undefined,
}))

function matchStatusLabel(status: string): string {
  if (status === 'SCHEDULED') { return t('match.status.SCHEDULED') }
  if (status === 'IN_PROGRESS') { return t('match.status.IN_PROGRESS') }
  if (status === 'COMPLETED') { return t('match.status.COMPLETED') }
  if (status === 'CANCELLED') { return t('match.status.CANCELLED') }
  return status
}

const columns = computed(() => [
  { accessorKey: 'sort', header: t('match.sort'), meta: { class: { th: 'text-right', td: 'text-right' } } },
  { accessorKey: 'tournamentName', header: t('match.tournament') },
  { accessorKey: 'redCornerFullName', header: t('match.redCorner') },
  { accessorKey: 'blueCornerFullName', header: t('match.blueCorner') },
  { accessorKey: 'weightCategoryLabel', header: t('match.weightCategory') },
  { accessorKey: 'disciplineLabel', header: t('match.disciplineLabel') },
  { accessorKey: 'status', header: t('match.status.label') },
  { id: 'actions', header: '' },
] as TableColumn<Record<string, unknown>>[])

function openCreate() {
  editingItem.value = null
  panelOpen.value = true
}

function openEdit(item: Match) {
  editingItem.value = item
  panelOpen.value = true
}

function confirmDelete(item: Match) {
  deleteTarget.value = item
  confirmOpen.value = true
}

async function deleteItem() {
  if (!deleteTarget.value) { return }
  deleting.value = true
  try {
    await api.del(`/api/desktop/matches/${deleteTarget.value.id}`)
    confirmOpen.value = false
    deleteTarget.value = null
    await tableRef.value?.refresh()
    toast.add({ title: t('match.deleted'), color: 'success' })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>
