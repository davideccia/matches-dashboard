<template>
  <div class="p-6">
    <UCard>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <UFormField name="status" :label="t('tournament.status.label')" required>
          <USelect v-model="state.status" :items="statusOptions" class="w-full sm:w-64" />
        </UFormField>

        <USeparator />

        <div class="space-y-4">
          <h4 class="flex items-center gap-2 text-sm font-medium text-muted">
            <UIcon name="i-mdi-information-outline" class="size-4" />
            {{ t('tournament.section.general') }}
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <UFormField name="name" :label="t('tournament.name')" required>
              <UInput v-model="state.name" class="w-full" />
            </UFormField>

            <UFormField name="date" :label="t('tournament.date')" required>
              <UInput v-model="state.date" type="date" class="w-full" />
            </UFormField>
          </div>
        </div>

        <USeparator />

        <div class="space-y-4">
          <h4 class="flex items-center gap-2 text-sm font-medium text-muted">
            <UIcon name="i-mdi-map-marker-outline" class="size-4" />
            {{ t('tournament.section.location') }}
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <UFormField name="location_name" :label="t('tournament.locationName')" required>
              <UInput v-model="state.location_name" class="w-full" />
            </UFormField>

            <UFormField name="location_city" :label="t('tournament.locationCity')" required>
              <UInput v-model="state.location_city" class="w-full" />
            </UFormField>

            <UFormField name="location_address" :label="t('tournament.locationAddress')" required class="sm:col-span-2">
              <UInput v-model="state.location_address" class="w-full" />
            </UFormField>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <UButton type="submit" :loading="saving">
            {{ t('common.save') }}
          </UButton>
        </div>
      </UForm>
    </UCard>

    <!-- Fuori dal form del torneo: i tier si salvano da soli, non col submit sopra. -->
    <div class="mt-6 flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 class="flex items-center gap-2 text-sm font-medium text-highlighted">
            <UIcon name="i-mdi-stairs" class="size-4" />
            {{ t('tournament.section.experienceTiers') }}
          </h4>
          <p class="mt-1 text-xs text-muted">
            {{ hasEnabledTier ? t('tournament.experienceTiers.overrideWarning') : t('tournament.experienceTiers.empty') }}
          </p>
        </div>
        <UButton
          icon="i-mdi-plus"
          size="sm"
          variant="subtle"
          @click="openTierCreate"
        >
          {{ t('common.add') }}
        </UButton>
      </div>

      <DataTable
        ref="tiersTable"
        url="/api/admin/experience_tiers"
        :columns="tierColumns"
        :params="{ tournament_id: tournament.id }"
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
              @click="openTierEdit((row.original as unknown as ExperienceTier))"
            />
            <UButton
              icon="i-mdi-delete"
              variant="ghost"
              color="error"
              size="sm"
              :aria-label="t('common.delete')"
              @click="confirmTierDelete((row.original as unknown as ExperienceTier))"
            />
          </div>
        </template>
      </DataTable>
    </div>

    <ClientOnly>
      <ExperienceTierFormPanel
        v-model="tierPanelOpen"
        :item="editingTier"
        :tournament-id="tournament.id"
        @saved="() => tiersTable?.refresh()"
      />

      <UModal v-model:open="tierConfirmOpen" :title="t('common.confirm')">
        <template #body>
          <p class="text-sm text-muted">
            {{ t('experienceTier.deleteConfirm') }}
          </p>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" color="neutral" @click="() => { tierConfirmOpen = false }">
              {{ t('common.cancel') }}
            </UButton>
            <UButton color="error" :loading="deletingTier" @click="deleteTier">
              {{ t('common.delete') }}
            </UButton>
          </div>
        </template>
      </UModal>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import type { ExperienceTier, Tournament } from '~/types/models'
import * as z from 'zod'
import { TOURNAMENT_STATUSES, type TournamentStatus } from '~/utils/constants'

const { tournament } = defineProps<{
  tournament: Tournament
}>()

const emit = defineEmits<{
  saved: []
}>()

const { t } = useI18n()
const api = useApi()
const toast = useToast()

const statusOptions = computed(() => [
  { label: t('tournament.status.scheduled'), value: 'scheduled' },
  { label: t('tournament.status.registrations_opened'), value: 'registrations_opened' },
  { label: t('tournament.status.registrations_closed'), value: 'registrations_closed' },
  { label: t('tournament.status.in_progress'), value: 'in_progress' },
  { label: t('tournament.status.completed'), value: 'completed' },
  { label: t('tournament.status.cancelled'), value: 'cancelled' },
])

const schema = z.object({
  name: z.string().min(1),
  location_name: z.string().min(1),
  location_address: z.string().min(1),
  location_city: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(TOURNAMENT_STATUSES),
})

const state = reactive({
  name: tournament.name,
  location_name: tournament.location_name,
  location_address: tournament.location_address,
  location_city: tournament.location_city,
  date: serverDateOnlyToInput(tournament.date),
  status: tournament.status as TournamentStatus,
})

watch(() => tournament.id, () => {
  state.name = tournament.name
  state.location_name = tournament.location_name
  state.location_address = tournament.location_address
  state.location_city = tournament.location_city
  state.date = serverDateOnlyToInput(tournament.date)
  state.status = tournament.status
})

const saving = ref(false)

async function onSubmit(event: FormSubmitEvent<z.infer<typeof schema>>) {
  saving.value = true
  try {
    const body = {
      name: event.data.name,
      location_name: event.data.location_name,
      location_address: event.data.location_address,
      location_city: event.data.location_city,
      date: event.data.date,
      status: event.data.status,
    }

    await api.put<{ data: Tournament }>(`/api/admin/tournaments/${tournament.id}`, body)

    emit('saved')
    toast.add({ title: t('tournament.updated'), color: 'success' })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    saving.value = false
  }
}

// ─── Range matchmaking del torneo ────────────────────────────────────────────
// Letti dall'endpoint nested, così la sezione è autonoma dal refetch del parent.

// Tipo esplicito: `hasEnabledTier` legge `items` ed è usato nel template, quindi
// l'inferenza dal ref del template sarebbe circolare (ts 7022).
const tiersTable = useTemplateRef<{ items: ExperienceTier[], refresh: () => Promise<void> }>('tiersTable')

const tierColumns = computed(() => [
  { accessorKey: 'label', header: t('experienceTier.label') },
  { id: 'range', header: t('experienceTier.range'), meta: { class: { th: 'text-right', td: 'text-right' } } },
  { accessorKey: 'enabled', header: t('experienceTier.enabled') },
  { id: 'actions', header: '' },
] as TableColumn<Record<string, unknown>>[])

// Solo i tier abilitati sostituiscono il set globale (MatchmakingService::tiers()).
const hasEnabledTier = computed(() => tiersTable.value?.items?.some(tier => tier.enabled) ?? false)

const tierPanelOpen = ref(false)
const editingTier = ref<ExperienceTier | null>(null)
const tierConfirmOpen = ref(false)
const tierDeleteTarget = ref<ExperienceTier | null>(null)
const deletingTier = ref(false)

function openTierCreate() {
  editingTier.value = null
  tierPanelOpen.value = true
}

function openTierEdit(tier: ExperienceTier) {
  editingTier.value = tier
  tierPanelOpen.value = true
}

function confirmTierDelete(tier: ExperienceTier) {
  tierDeleteTarget.value = tier
  tierConfirmOpen.value = true
}

async function deleteTier() {
  if (!tierDeleteTarget.value) { return }
  deletingTier.value = true
  try {
    await api.del(`/api/admin/experience_tiers/${tierDeleteTarget.value.id}`)
    tierConfirmOpen.value = false
    tierDeleteTarget.value = null
    await tiersTable.value?.refresh()
    toast.add({ title: t('experienceTier.deleted'), color: 'success' })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    deletingTier.value = false
  }
}
</script>
