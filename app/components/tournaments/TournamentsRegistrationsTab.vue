<template>
  <div class="flex flex-col gap-5 p-6">
    <DataTable
      ref="tableRef"
      :url="registrationsUrl"
      :columns="columns"
      :params="tableParams"
      :active-filters="activeFilters"
      empty-icon="i-mdi-clipboard-list-outline"
      :bulk-actions="[{ endpoint: '/api/admin/registrations/bulk', method: 'DELETE', icon: 'i-mdi-delete', label: t('common.delete'), ids_key: 'ids', color: 'error' }]"
      @clear-filters="clearFilters"
    >
      <template #toolbar>
        <UButton icon="i-mdi-plus" @click="openCreate">
          {{ t('common.add') }}
        </UButton>
      </template>
      <template #fk-filters>
        <FilterField :label="t('registration.athlete')" class="w-full sm:w-56">
          <AthleteSelectMenu
            v-model="fkFilters.athlete.id"
            :placeholder="fkFilters.athlete.label ?? t('registration.selectAthlete')"
            :query-params="athleteQueryParams"
            clearable
            class="w-full"
            @select="(item) => { fkFilters.athlete.label = String(item.full_name ?? '') }"
          />
        </FilterField>
        <FilterField :label="t('registration.discipline')" class="w-full sm:w-56">
          <ApiSelectMenu
            v-model="fkFilters.discipline.id"
            :endpoint="disciplinesEndpoint"
            label-key="label"
            :placeholder="fkFilters.discipline.label ?? t('registration.selectDiscipline')"
            clearable
            class="w-full"
            @select="(item) => { fkFilters.discipline.label = String(item.label ?? '') }"
          />
        </FilterField>
        <FilterField :label="t('registration.weightCategory')" class="w-full sm:w-56">
          <ApiSelectMenu
            v-model="fkFilters.weightCategory.id"
            endpoint="/api/admin/weight_categories"
            label-key="label"
            :placeholder="fkFilters.weightCategory.label ?? t('registration.selectWeightCategory')"
            clearable
            class="w-full"
            @select="(item) => { fkFilters.weightCategory.label = String(item.label ?? '') }"
          />
        </FilterField>
      </template>
      <template #filters>
        <TriStateFilter v-model="unpaid" :label="t('registration.filterUnpaid')" />
        <TriStateFilter v-model="unarrived" :label="t('registration.filterUnarrived')" />
        <TriStateFilter v-model="weightInExceeded" :label="t('registration.filterWeightExceeded')" />
        <TriStateFilter v-model="isAdult" :label="t('athlete.filterIsAdult')" />
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
// true ⇒ solo atleti maggiorenni, false ⇒ solo minorenni.
const isAdult = ref<boolean | null>(null)
const panelOpen = ref(false)
const editingItem = ref<Registration | null>(null)
const confirmOpen = ref(false)
const deleteTarget = ref<Registration | null>(null)
const deleting = ref(false)

const registrationsUrl = computed(() => `/api/admin/tournaments/${props.tournamentId}/registrations?with=weightCategory,athlete,discipline`)

const disciplinesEndpoint = computed(() => `/api/admin/tournaments/${props.tournamentId}/disciplines`)
// Computed e non oggetto inline: ApiSelectMenu rifà la fetch a ogni nuovo riferimento.
const athleteQueryParams = computed(() => ({ tournament_id: props.tournamentId }))

// Filtri sulle FK. La select svuota la propria lista alla chiusura: l'etichetta
// della voce scelta va conservata qui per restare visibile come placeholder.
const FK_FILTER_KEYS = ['athlete', 'discipline', 'weightCategory'] as const
type FkFilterKey = typeof FK_FILTER_KEYS[number]

const fkFilters = reactive<Record<FkFilterKey, { id: string | null, label: string | null }>>({
  athlete: { id: null, label: null },
  discipline: { id: null, label: null },
  weightCategory: { id: null, label: null },
})

function clearFkFilter(key: FkFilterKey) {
  fkFilters[key] = { id: null, label: null }
}

// La X di ApiSelectMenu azzera solo l'id: l'etichetta conservata va pulita qui.
FK_FILTER_KEYS.forEach((key) => {
  watch(() => fkFilters[key].id, (id) => {
    if (!id) { clearFkFilter(key) }
  })
})

// Le FK del torneo precedente non hanno senso sul nuovo.
watch(() => props.tournamentId, () => {
  FK_FILTER_KEYS.forEach(clearFkFilter)
})

const activeFilters = computed(() => countActiveFilters([
  unpaid.value,
  unarrived.value,
  weightInExceeded.value,
  isAdult.value,
  ...FK_FILTER_KEYS.map(key => fkFilters[key].id),
]))

function clearFilters() {
  unpaid.value = null
  unarrived.value = null
  weightInExceeded.value = null
  isAdult.value = null
  FK_FILTER_KEYS.forEach(clearFkFilter)
}

const tableParams = computed(() => ({
  unpaid: unpaid.value === null ? undefined : unpaid.value ? 1 : 0,
  unarrived: unarrived.value === null ? undefined : unarrived.value ? 1 : 0,
  weight_in_exceeded: weightInExceeded.value === null ? undefined : weightInExceeded.value ? 1 : 0,
  is_adult: isAdult.value === null ? undefined : isAdult.value ? 1 : 0,
  athlete_id: fkFilters.athlete.id ?? undefined,
  discipline_id: fkFilters.discipline.id ?? undefined,
  weight_category_id: fkFilters.weightCategory.id ?? undefined,
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
