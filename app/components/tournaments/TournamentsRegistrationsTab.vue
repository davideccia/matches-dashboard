<template>
  <div class="flex flex-col gap-5 p-6">
    <DataTable
      ref="tableRef"
      :url="registrationsUrl"
      :columns="columns"
      :params="tableParams"
      empty-icon="i-mdi-clipboard-list-outline"
      :bulk-actions="[{ endpoint: '/api/admin/registrations/bulk', method: 'DELETE', icon: 'i-mdi-delete', label: t('common.delete'), ids_key: 'ids', color: 'error' }]"
    >
      <template #filters>
        <UButton icon="i-mdi-plus" @click="openCreate">
          {{ t('common.add') }}
        </UButton>
        <USeparator orientation="vertical" class="h-5" />
        <UButton
          :color="unpaid === null ? 'neutral' : unpaid ? 'success' : 'error'"
          :variant="unpaid === null ? 'outline' : 'subtle'"
          size="sm"
          @click="() => { unpaid = unpaid === null ? true : unpaid ? false : null }"
        >
          {{ t('registration.filterUnpaid') }}
        </UButton>
        <UButton
          :color="unarrived === null ? 'neutral' : unarrived ? 'success' : 'error'"
          :variant="unarrived === null ? 'outline' : 'subtle'"
          size="sm"
          @click="() => { unarrived = unarrived === null ? true : unarrived ? false : null }"
        >
          {{ t('registration.filterUnarrived') }}
        </UButton>
        <UButton
          :color="weightInExceeded === null ? 'neutral' : weightInExceeded ? 'success' : 'error'"
          :variant="weightInExceeded === null ? 'outline' : 'subtle'"
          size="sm"
          @click="() => { weightInExceeded = weightInExceeded === null ? true : weightInExceeded ? false : null }"
        >
          {{ t('registration.filterWeightExceeded') }}
        </UButton>
      </template>
      <template #athlete_full_name-cell="{ row }">
        <span class="flex items-center gap-2">
          {{ ((row.original as unknown as Registration)).athlete?.full_name }}
          <UBadge
            v-if="((row.original as unknown as Registration)).athlete?.age !== undefined"
            color="primary"
            variant="subtle"
            size="md"
            icon="i-mdi-cake-variant-outline"
          >
            {{ ((row.original as unknown as Registration)).athlete?.age }}
          </UBadge>
        </span>
      </template>
      <template #weight_category_label-cell="{ row }">
        <UTooltip :delay-duration="200">
          <template #content>
            <span class="flex items-center gap-1.5">
              <span
                class="size-2 rounded-full shrink-0"
                :class="((row.original as unknown as Registration)).weight_in === null ? 'bg-yellow-400' : ((row.original as unknown as Registration)).weight_in! <= ((row.original as unknown as Registration)).weight_category?.value! ? 'bg-success' : 'bg-error'"
              />
              <template v-if="((row.original as unknown as Registration)).weight_in !== null">
                {{ t('registration.weightRegistered') }}: {{ ((row.original as unknown as Registration)).weight_in }} kg
              </template>
              <template v-else>
                {{ t('registration.noWeightRegistered') }}
              </template>
            </span>
          </template>
          <UBadge
            :color="((row.original as unknown as Registration)).weight_in === null ? 'neutral' : ((row.original as unknown as Registration)).weight_in! <= ((row.original as unknown as Registration)).weight_category?.value! ? 'success' : 'error'"
            variant="subtle"
            class="cursor-default"
          >
            {{ ((row.original as unknown as Registration)).weight_category?.label }}
          </UBadge>
        </UTooltip>
      </template>
      <template #paid-cell="{ row }">
        <UIcon
          :name="((row.original as unknown as Registration)).paid_at ? 'i-mdi-check-circle' : 'i-mdi-close-circle'"
          :class="((row.original as unknown as Registration)).paid_at ? 'text-success' : 'text-error'"
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
      <template #created_at-cell="{ row }">
        {{ formatServerDate(((row.original as unknown as Registration)).created_at, locale) }}
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

    <ClientOnly>
      <RegistrationFormPanel v-model="panelOpen" :item="editingItem" :tournament-id="tournamentId" @saved="() => tableRef?.refresh()" />

      <UModal v-model:open="confirmOpen" :title="t('common.confirm')">
        <template #body>
          <p class="text-sm text-muted">
            {{ t('registration.deleteConfirm') }}
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
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Registration } from '~/types/models'

const props = defineProps<{
  tournamentId: string
}>()

const { t, locale } = useI18n()
const api = useApi()
const toast = useToast()

const tableRef = useTemplateRef('tableRef')

const unpaid = ref<boolean | null>(null)
const unarrived = ref<boolean | null>(null)
const weightInExceeded = ref<boolean | null>(null)
const panelOpen = ref(false)
const editingItem = ref<Registration | null>(null)
const confirmOpen = ref(false)
const deleteTarget = ref<Registration | null>(null)
const deleting = ref(false)

const registrationsUrl = computed(() => `/api/admin/tournaments/${props.tournamentId}/registrations?with=weightCategory,athlete,discipline`)

const tableParams = computed(() => ({
  unpaid: unpaid.value === null ? undefined : unpaid.value ? 1 : 0,
  unarrived: unarrived.value === null ? undefined : unarrived.value ? 1 : 0,
  weight_in_exceeded: weightInExceeded.value === null ? undefined : weightInExceeded.value ? 1 : 0,
}))

const columns = computed(() => [
  { accessorKey: 'athlete.full_name', header: t('registration.athlete') },
  { accessorKey: 'discipline.label', header: t('registration.discipline') },
  { id: 'weight_category_label', header: t('registration.weightCategory'), meta: { class: { th: 'text-center', td: 'text-center' } } },
  { id: 'paid', header: t('registration.paid'), meta: { class: { th: 'text-center', td: 'text-center' } } },
  { id: 'present', header: t('registration.arrived'), meta: { class: { th: 'text-center', td: 'text-center' } } },
  { id: 'notes', header: t('registration.notes') },
  { accessorKey: 'created_at', header: t('registration.createdAt') },
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
    await api.download(`/api/admin/registrations/${item.id}/pdf`, `registration-${item.id}.pdf`)
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
    await api.del(`/api/admin/registrations/${deleteTarget.value.id}`)
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
