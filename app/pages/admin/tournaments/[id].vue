<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="tournament?.name ?? t('tournament.title')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="status === 'pending'" class="flex items-center justify-center p-12">
        <UIcon name="i-mdi-loading" class="animate-spin text-2xl" />
      </div>
      <UTabs
        v-else-if="tournament"
        v-model="activeTab"
        :items="tabs"
        class="h-full flex flex-col"
        :ui="{ content: 'flex-1 overflow-y-auto' }"
      >
        <template #registry>
          <TournamentsRegistryTab :tournament="tournament" @saved="refresh" />
        </template>
        <template #registrations>
          <TournamentsRegistrationsTab :tournament-id="tournamentId" />
        </template>
        <template #matchesList>
          <TournamentsMatchesListTab :tournament-id="tournamentId" />
        </template>
        <template #matchesBoard>
          <TournamentsMatchesBoardTab :tournament-id="tournamentId" />
        </template>
      </UTabs>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { Tournament } from '~/types/models'

definePageMeta({ layout: 'default' })

const route = useRoute()
const { t } = useI18n()
const api = useApi()

const tournamentId = computed(() => route.params.id as string)

const { data: tournament, status, refresh } = useLazyAsyncData(
  () => `tournament-${tournamentId.value}`,
  () => api.get<{ data: Tournament }>(`/api/admin/tournaments/${tournamentId.value}`).then(res => res.data),
  { watch: [tournamentId] },
)

const activeTab = ref('registry')

const tabs = computed(() => [
  { label: t('tournament.tab.registry'), icon: 'i-mdi-card-account-details-outline', slot: 'registry', value: 'registry' },
  { label: t('tournament.tab.registrations'), icon: 'i-mdi-clipboard-list-outline', slot: 'registrations', value: 'registrations' },
  { label: t('tournament.tab.matchesList'), icon: 'i-mdi-format-list-bulleted', slot: 'matchesList', value: 'matchesList' },
  { label: t('tournament.tab.matchesBoard'), icon: 'i-mdi-view-grid-outline', slot: 'matchesBoard', value: 'matchesBoard' },
])
</script>
