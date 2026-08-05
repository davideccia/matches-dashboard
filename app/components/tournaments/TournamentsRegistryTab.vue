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
    <UCard class="mt-6">
      <template #header>
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
      </template>

      <div v-if="tiersStatus === 'pending'" class="space-y-2">
        <USkeleton v-for="i in 2" :key="i" class="h-9 w-full" />
      </div>
      <ul v-else-if="tiers?.length" class="divide-y divide-default rounded-md border border-muted">
        <li
          v-for="tier in tiers"
          :key="tier.id"
          class="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm"
          :class="{ 'opacity-60': !tier.enabled }"
        >
          <span class="font-medium text-highlighted">{{ tier.label }}</span>
          <span class="text-muted opacity-50">·</span>
          <span class="text-default tabular-nums">
            {{ formatTierRange(tier.min_match_count, tier.max_match_count) }}
          </span>
          <UBadge v-if="!tier.enabled" color="neutral" variant="subtle" icon="i-lucide-circle-slash">
            {{ t('experienceTier.inactive') }}
          </UBadge>
          <div class="ml-auto flex gap-1">
            <UButton
              icon="i-mdi-pencil"
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-label="t('common.edit')"
              @click="openTierEdit(tier)"
            />
            <UButton
              icon="i-mdi-delete"
              variant="ghost"
              color="error"
              size="sm"
              :aria-label="t('common.delete')"
              @click="confirmTierDelete(tier)"
            />
          </div>
        </li>
      </ul>
      <p v-else class="text-sm text-muted">
        {{ t('tournament.experienceTiers.emptyHint') }}
      </p>
    </UCard>

    <ClientOnly>
      <ExperienceTierFormPanel
        v-model="tierPanelOpen"
        :item="editingTier"
        :tournament-id="tournament.id"
        @saved="() => refreshTiers()"
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
import type { FormSubmitEvent } from '@nuxt/ui'
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

const { data: tiers, status: tiersStatus, refresh: refreshTiers } = useLazyAsyncData(
  () => `tournament-${tournament.id}-experience-tiers`,
  () => api.get<{ data: ExperienceTier[] }>(`/api/admin/tournaments/${tournament.id}/experience_tiers`).then(res => res.data),
  { watch: [() => tournament.id] },
)

// Solo i tier abilitati sostituiscono il set globale (MatchmakingService::tiers()).
const hasEnabledTier = computed(() => tiers.value?.some(tier => tier.enabled) ?? false)

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
    await refreshTiers()
    toast.add({ title: t('experienceTier.deleted'), color: 'success' })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    deletingTier.value = false
  }
}
</script>
