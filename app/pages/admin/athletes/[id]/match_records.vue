<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="athlete?.full_name ?? t('athlete.title')">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton
            icon="i-mdi-arrow-left"
            variant="ghost"
            color="neutral"
            size="sm"
            :aria-label="t('common.back')"
            @click="goBack"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="athleteStatus === 'pending'" class="flex items-center justify-center p-12">
        <UIcon name="i-mdi-loading" class="animate-spin text-2xl" />
      </div>

      <div v-else class="flex flex-col gap-5 p-6">
        <AthleteMatchRecordsSummary :item="athlete" />

        <USeparator />

        <div class="flex flex-wrap items-center gap-2">
          <div class="w-72 shrink-0">
            <ApiSelectMenu
              v-model="tournamentId"
              endpoint="/api/admin/tournaments"
              label-key="name"
              :placeholder="t('athlete.filterByTournament')"
            />
          </div>
          <UButton
            v-if="tournamentId !== null"
            icon="i-mdi-close"
            variant="ghost"
            color="neutral"
            size="sm"
            :aria-label="t('common.cancel')"
            @click="() => { tournamentId = null }"
          />
        </div>

        <div v-if="matchesLoading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <USkeleton v-for="n in 6" :key="n" class="h-48 rounded-xl" />
        </div>

        <div v-else-if="matches.length === 0" class="flex flex-col items-center gap-2 py-16 text-muted">
          <UIcon name="i-mdi-sword-cross" class="size-10 opacity-40" />
          <span class="text-sm">{{ t('common.noResults') }}</span>
        </div>

        <template v-else>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <MatchRecordCardReadOnly
              v-for="match in matches"
              :key="match.id"
              :match="match"
              :show-judges-points="true"
              show-tournament
            />
          </div>

          <div class="flex justify-end">
            <UPagination
              v-if="total > perPage"
              v-model:page="page"
              :total="total"
              :items-per-page="perPage"
            />
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { Athlete, MatchRecord } from '~/types/models'

definePageMeta({ layout: 'default' })

const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()
const api = useApi()

const athleteId = computed(() => route.params.id as string)

const { data: athlete, status: athleteStatus } = useLazyAsyncData(
  () => `athlete-${athleteId.value}`,
  () => api.get<{ data: Athlete }>(`/api/admin/athletes/${athleteId.value}`).then(res => res.data),
  { watch: [athleteId] },
)

const tournamentId = ref<string | null>(null)
const page = ref(1)

watch(tournamentId, () => { page.value = 1 })

interface PageData<T> {
  data: T[]
  meta: { total: number, current_page: number, last_page: number, per_page: number }
}

const { data: matchRecordsData, status: matchRecordsStatus } = useLazyAsyncData(
  () => `athlete-match-records-${athleteId.value}-${tournamentId.value}-${page.value}`,
  () => api.get<PageData<MatchRecord>>(
    `/api/admin/athletes/${athleteId.value}/match_records?with=tournament,red_corner,blue_corner,winner,weight_category,discipline`,
    {
      page: page.value,
      status: 'completed',
      ...(tournamentId.value ? { tournament_id: tournamentId.value } : {}),
    },
  ),
  { watch: [athleteId, tournamentId, page] },
)

const matches = computed(() => matchRecordsData.value?.data ?? [])
const total = computed(() => matchRecordsData.value?.meta?.total ?? 0)
const perPage = computed(() => matchRecordsData.value?.meta?.per_page ?? 15)
const matchesLoading = computed(() => matchRecordsStatus.value === 'pending')

function goBack() {
  navigateTo(localePath({ name: 'admin-athletes' }))
}
</script>
