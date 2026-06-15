<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('nav.registrations')">
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
          url="/api/desktop/registrations"
          :columns="columns"
          :params="tableParams"
          empty-icon="i-mdi-clipboard-list-outline"
        >
          <template #filters>
            <ApiSelectMenu
              v-model="tournamentId"
              endpoint="/api/desktop/tournaments"
              label-key="name"
              :placeholder="t('registration.selectTournament')"
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
          <template #weightCategoryLabel-cell="{ row }">
            <UTooltip :delay-duration="200">
              <template #content>
                <span class="flex items-center gap-1.5">
                  <span
                    class="size-2 rounded-full shrink-0"
                    :class="((row.original as unknown as Registration)).weightIn === null ? 'bg-yellow-400' : ((row.original as unknown as Registration)).weightIn! <= ((row.original as unknown as Registration)).weightCategoryValue! ? 'bg-success' : 'bg-error'"
                  />
                  <template v-if="((row.original as unknown as Registration)).weightIn !== null">
                    {{ t('registration.weightRegistered') }}: {{ ((row.original as unknown as Registration)).weightIn }} kg
                  </template>
                  <template v-else>
                    {{ t('registration.noWeightRegistered') }}
                  </template>
                </span>
              </template>
              <UBadge
                :color="((row.original as unknown as Registration)).weightIn === null ? 'neutral' : ((row.original as unknown as Registration)).weightIn! <= ((row.original as unknown as Registration)).weightCategoryValue! ? 'success' : 'error'"
                variant="subtle"
                class="cursor-default"
              >
                {{ ((row.original as unknown as Registration)).weightCategoryLabel }}
              </UBadge>
            </UTooltip>
          </template>
          <template #paid-cell="{ row }">
            <UIcon
              :name="((row.original as unknown as Registration)).paidAt ? 'i-mdi-check-circle' : 'i-mdi-close-circle'"
              :class="((row.original as unknown as Registration)).paidAt ? 'text-success' : 'text-error'"
              class="size-5"
            />
          </template>
          <template #present-cell="{ row }">
            <UIcon
              :name="((row.original as unknown as Registration)).arrived ? 'i-mdi-check-circle' : 'i-mdi-close-circle'"
              :class="((row.original as unknown as Registration)).arrived ? 'text-success' : 'text-error'"
              class="size-5"
            />
          </template>
          <template #notes-cell="{ row }">
            <UTooltip v-if="((row.original as unknown as Registration)).notes" :text="((row.original as unknown as Registration)).notes!" :delay-duration="200">
              <UButton icon="i-mdi-note-text-outline" variant="ghost" color="neutral" size="sm" />
            </UTooltip>
          </template>
          <template #actions-cell="{ row }">
            <div class="flex justify-end gap-1">
              <UButton
                icon="i-mdi-file-download-outline"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="downloadPdf((row.original as unknown as Registration))"
              />
              <UButton
                icon="i-mdi-pencil"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="openEdit((row.original as unknown as Registration))"
              />
              <UButton
                icon="i-mdi-delete"
                variant="ghost"
                color="error"
                size="sm"
                @click="confirmDelete((row.original as unknown as Registration))"
              />
            </div>
          </template>
        </DataTable>
      </div>
    </template>
  </UDashboardPanel>

  <ClientOnly>
    <RegistrationFormPanel v-model="panelOpen" :item="editingItem" @saved="() => tableRef?.refresh()" />

    <UModal v-model:open="confirmOpen" :title="t('common.confirm')">
      <template #body>
        <p class="text-sm text-muted">
          {{ t('registration.deleteConfirm') }}
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
import type { Registration } from '~/types/models'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const api = useApi()
const toast = useToast()

const tableRef = useTemplateRef('tableRef')

const tournamentId = ref<string | null>(null)
const panelOpen = ref(false)
const editingItem = ref<Registration | null>(null)
const confirmOpen = ref(false)
const deleteTarget = ref<Registration | null>(null)
const deleting = ref(false)

const tableParams = computed(() => ({
  tournamentId: tournamentId.value ?? undefined,
}))

const columns = computed(() => [
  { accessorKey: 'athleteFullName', header: t('registration.athlete') },
  { accessorKey: 'tournamentName', header: t('registration.tournament') },
  { accessorKey: 'disciplineLabel', header: t('registration.discipline') },
  { id: 'weightCategoryLabel', header: t('registration.weightCategory'), meta: { class: { th: 'text-center', td: 'text-center' } } },
  { id: 'paid', header: t('registration.paid'), meta: { class: { th: 'text-center', td: 'text-center' } } },
  { id: 'present', header: t('registration.arrived'), meta: { class: { th: 'text-center', td: 'text-center' } } },
  { id: 'notes', header: t('registration.notes') },
  { id: 'actions', header: '' },
] as TableColumn<Record<string, unknown>>[])

function openCreate() {
  editingItem.value = null
  panelOpen.value = true
}

function openEdit(item: Registration) {
  editingItem.value = item
  panelOpen.value = true
}

async function downloadPdf(item: Registration) {
  try {
    await api.download(`/api/desktop/registrations/${item.id}/pdf`, `registration-${item.id}.pdf`)
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  }
}

function confirmDelete(item: Registration) {
  deleteTarget.value = item
  confirmOpen.value = true
}

async function deleteItem() {
  if (!deleteTarget.value) { return }
  deleting.value = true
  try {
    await api.del(`/api/desktop/registrations/${deleteTarget.value.id}`)
    confirmOpen.value = false
    deleteTarget.value = null
    await tableRef.value?.refresh()
    toast.add({ title: t('registration.deleted'), color: 'success' })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>
