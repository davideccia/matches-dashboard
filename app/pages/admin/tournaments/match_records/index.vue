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
        <OrphanRegistrationsAlert :items="matchmakingIssues" :skeleton="!tournamentId || orphanLoading" />
        <USeparator />
        <DataTable
          ref="tableRef"
          url="/api/admin/match_records?with=tournament,redCorner,blueCorner,weightCategory,discipline"
          :columns="columns"
          :params="tableParams"
          empty-icon="i-mdi-sword-cross"
          :bulk-actions="[{ endpoint: '/api/admin/match_records/bulk', method: 'DELETE', icon: 'i-mdi-delete', label: t('common.delete'), ids_key: 'ids', color: 'error' }]"
        >
          <template #filters>
            <ApiSelectMenu
              v-model="tournamentId"
              endpoint="/api/admin/tournaments"
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
            <div class="h-6 w-px bg-accented" />
            <UButton
              icon="i-mdi-cog-play"
              color="primary"
              variant="soft"
              :loading="generating"
              :disabled="!tournamentId"
              @click="confirmGenerateOpen = true"
            >
              {{ t('match.generate') }}
            </UButton>
          </template>
          <template #status-cell="{ row }">
            <UBadge
              :color="statusBadgeColor((row.original as unknown as MatchRecord).status)"
              variant="subtle"
            >
              <span
                v-if="isPulsing((row.original as unknown as MatchRecord).status)"
                class="size-1.5 rounded-full bg-current animate-pulse"
              />
              {{ matchStatusLabel((row.original as unknown as MatchRecord).status) }}
            </UBadge>
          </template>
          <template #actions-cell="{ row }">
            <div class="flex justify-end gap-1">
              <UButton
                icon="i-mdi-pencil"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="openEdit((row.original as unknown as MatchRecord))"
              />
              <UButton
                icon="i-mdi-delete"
                variant="ghost"
                color="error"
                size="sm"
                @click="confirmDelete((row.original as unknown as MatchRecord))"
              />
            </div>
          </template>
        </DataTable>
      </div>
    </template>
  </UDashboardPanel>

  <ClientOnly>
    <MatchRecordFormPanel v-model="panelOpen" :item="editingItem" @saved="() => { tableRef?.refresh(); refreshMatchmakingIssues() }" />

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

    <UModal v-model:open="confirmGenerateOpen" :title="t('common.confirm')">
      <template #body>
        <p class="text-sm text-muted">
          {{ t('match.generateConfirm') }}
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="confirmGenerateOpen = false">
            {{ t('common.cancel') }}
          </UButton>
          <UButton color="primary" :loading="generating" @click="generateMatches">
            {{ t('common.confirm') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { BadgeProps, TableColumn } from '@nuxt/ui'
import type { MatchmakingIssue, MatchRecord } from '~/types/models'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const api = useApi()
const toast = useToast()

const tableRef = useTemplateRef('tableRef')

const tournamentId = ref<string | null>(null)
const matchmakingIssues = ref<MatchmakingIssue[]>([])
const orphanLoading = ref(false)
const confirmGenerateOpen = ref(false)
const generating = ref(false)

async function refreshMatchmakingIssues() {
  if (!tournamentId.value) { return }
  orphanLoading.value = true
  try {
    const tournament = await api.get<{ data: { matchmaking_issues: MatchmakingIssue[] | null } }>(`/api/admin/tournaments/${tournamentId.value}`)
    matchmakingIssues.value = tournament.data.matchmaking_issues ?? []
  } finally {
    orphanLoading.value = false
  }
}

watch(tournamentId, (id) => {
  matchmakingIssues.value = []
  if (!id) { return }
  refreshMatchmakingIssues()
})
const panelOpen = ref(false)
const editingItem = ref<MatchRecord | null>(null)
const confirmOpen = ref(false)
const deleteTarget = ref<MatchRecord | null>(null)
const deleting = ref(false)

const tableParams = computed(() => ({
  tournament_id: tournamentId.value ?? undefined,
}))

const STATUS_COLORS: Record<string, BadgeProps['color']> = {
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
}
const PULSING_STATUSES = new Set(['in_progress'])

function statusBadgeColor(status: string): BadgeProps['color'] {
  return STATUS_COLORS[status] ?? 'neutral'
}

function isPulsing(status: string): boolean {
  return PULSING_STATUSES.has(status)
}

function matchStatusLabel(status: string): string {
  if (status === 'scheduled') { return t('match.status.scheduled') }
  if (status === 'in_progress') { return t('match.status.in_progress') }
  if (status === 'completed') { return t('match.status.completed') }
  if (status === 'cancelled') { return t('match.status.cancelled') }
  return status
}

const columns = computed(() => [
  { accessorKey: 'sort', header: t('match.sort'), meta: { class: { th: 'text-right', td: 'text-right' } } },
  { accessorKey: 'tournament.name', header: t('match.tournament') },
  { accessorKey: 'red_corner.full_name', header: t('match.redCorner') },
  { accessorKey: 'blue_corner.full_name', header: t('match.blueCorner') },
  { accessorKey: 'weight_category.label', header: t('match.weightCategory') },
  { accessorKey: 'discipline.label', header: t('match.disciplineLabel') },
  { accessorKey: 'status', header: t('match.status.label') },
  { id: 'actions', header: '' },
] as TableColumn<Record<string, unknown>>[])

async function generateMatches() {
  if (!tournamentId.value) { return }
  generating.value = true
  try {
    await api.post(`/api/admin/tournaments/${tournamentId.value}/match_records/generate`)
    confirmGenerateOpen.value = false
    toast.add({ title: t('match.generated'), color: 'success' })
    await Promise.all([tableRef.value?.refresh(), refreshMatchmakingIssues()])
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e), color: 'error' })
  } finally {
    generating.value = false
  }
}

function openCreate() {
  editingItem.value = null
  panelOpen.value = true
}

function openEdit(item: MatchRecord) {
  editingItem.value = item
  panelOpen.value = true
}

function confirmDelete(item: MatchRecord) {
  deleteTarget.value = item
  confirmOpen.value = true
}

async function deleteItem() {
  if (!deleteTarget.value) { return }
  deleting.value = true
  try {
    await api.del(`/api/admin/match_records/${deleteTarget.value.id}`)
    confirmOpen.value = false
    deleteTarget.value = null
    await Promise.all([tableRef.value?.refresh(), refreshMatchmakingIssues()])
    toast.add({ title: t('match.deleted'), color: 'success' })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>
