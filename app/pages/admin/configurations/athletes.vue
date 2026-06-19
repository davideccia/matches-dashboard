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
          url="/api/admin/athletes"
          :columns="columns"
          empty-icon="i-mdi-account"
        >
          <template #full_name-cell="{ row }">
            <span class="flex items-center gap-2 min-w-0">
              <span class="truncate">{{ (row.original as unknown as Athlete).full_name }}</span>
              <span
                v-if="(row.original as unknown as Athlete).match_records_count != null"
                class="inline-flex items-center gap-1 shrink-0 rounded-full border border-muted bg-elevated px-1.5 py-px text-[11px] font-medium text-muted"
              >
                <UIcon name="i-mdi-boxing-glove" class="size-4 opacity-70 bg-amber-400" />
                {{ (row.original as unknown as Athlete).match_records_count }}
              </span>
            </span>
          </template>
          <template #birth_date-cell="{ row }">
            {{ formatServerDateOnly(((row.original as unknown as Athlete)).birth_date, locale) }}
          </template>
          <template #gender-cell="{ row }">
            <UBadge
              v-if="(row.original as unknown as Athlete).gender === 'male'"
              color="info"
              variant="subtle"
            >
              {{ genderLabel((row.original as unknown as Athlete).gender) }}
            </UBadge>
            <UBadge
              v-else
              variant="subtle"
              class="bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-300"
            >
              {{ genderLabel((row.original as unknown as Athlete).gender) }}
            </UBadge>
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
  if (gender === 'male') { return t('athlete.gender.male') }
  if (gender === 'female') { return t('athlete.gender.female') }
  return gender
}

const columns = computed(() => [
  { accessorKey: 'full_name', header: t('athlete.firstName') },
  { accessorKey: 'birth_date', header: t('athlete.birthDate') },
  { accessorKey: 'gender', header: t('athlete.gender.label') },
  { accessorKey: 'tax_number', header: t('athlete.taxNumber') },
  { accessorKey: 'team_name', header: t('athlete.teamName') },
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
    await api.del(`/api/admin/athletes/${deleteTarget.value.id}`)
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
