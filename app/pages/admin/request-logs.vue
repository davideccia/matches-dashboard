<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('nav.requestLogs')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-5 p-6">
        <DataTable
          url="/api/admin/api_request_logs"
          :columns="columns"
          :params="tableParams"
          :searchable="false"
          empty-icon="i-mdi-format-list-bulleted"
        >
          <template #filters>
            <div class="flex items-center gap-1 w-56">
              <ApiSelectMenu
                v-model="userId"
                endpoint="/api/admin/users"
                label-key="username"
                :placeholder="selectedUserLabel ?? t('requestLog.filterUser')"
                @select="onUserSelect"
              />
              <UButton
                v-if="userId"
                icon="i-mdi-close"
                variant="ghost"
                color="neutral"
                size="sm"
                :aria-label="t('requestLog.clearUser')"
                @click="clearUser"
              />
            </div>
            <USelect
              v-model="method"
              :items="methodItems"
              :placeholder="t('requestLog.filterMethod')"
              class="w-32"
            />
            <USelect
              v-model="statusClass"
              :items="statusClassItems"
              :placeholder="t('requestLog.filterStatusClass')"
              class="w-36"
            />
            <UInput
              v-model="status"
              type="number"
              :min="100"
              :max="599"
              :placeholder="t('requestLog.filterStatus')"
              class="w-36"
            />
            <UInput
              v-model="pathInput"
              :placeholder="t('requestLog.filterPath')"
              class="w-48"
            />
            <UInput
              v-model="dateFrom"
              type="date"
              :aria-label="t('requestLog.filterDateFrom')"
              class="w-40"
            />
            <UInput
              v-model="dateTo"
              type="date"
              :aria-label="t('requestLog.filterDateTo')"
              class="w-40"
            />
          </template>
          <template #created_at-cell="{ row }">
            {{ formatServerDate((row.original as unknown as ApiRequestLog).created_at, locale) }}
          </template>
          <template #user-cell="{ row }">
            {{ (row.original as unknown as ApiRequestLog).user?.username ?? MISSING_VALUE }}
          </template>
          <template #method-cell="{ row }">
            <UBadge color="neutral" variant="subtle">
              {{ (row.original as unknown as ApiRequestLog).method }}
            </UBadge>
          </template>
          <template #route_name-cell="{ row }">
            {{ (row.original as unknown as ApiRequestLog).route_name ?? MISSING_VALUE }}
          </template>
          <template #status-cell="{ row }">
            <UBadge :color="statusBadgeColor((row.original as unknown as ApiRequestLog).status)" variant="subtle">
              {{ (row.original as unknown as ApiRequestLog).status }}
            </UBadge>
          </template>
          <template #duration_ms-cell="{ row }">
            {{ (row.original as unknown as ApiRequestLog).duration_ms }} ms
          </template>
        </DataTable>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { BadgeProps, TableColumn } from '@nuxt/ui'
import type { ApiRequestLog } from '~/types/models'

definePageMeta({
  layout: 'default',
  // Solo superadmin: il backend resta comunque la difesa reale (403).
  middleware: () => {
    const { user } = useAuth()
    if (!user.value?.superadmin) {
      return navigateTo(useLocalePath()('/admin'))
    }
  },
})

const { t, locale } = useI18n()

const ALL = 'all'
const PATH_DEBOUNCE_MS = 300
const HTTP_SUCCESS_MAX = 300
const HTTP_REDIRECT_MAX = 400
const HTTP_CLIENT_ERROR_MAX = 500

const userId = ref<string | null>(null)
const selectedUserLabel = ref<string | null>(null)
const method = ref<string>(ALL)
const statusClass = ref<string>(ALL)
const status = ref<number | undefined>(undefined)
const pathInput = ref('')
const path = ref('')
const dateFrom = ref<string | undefined>(undefined)
const dateTo = ref<string | undefined>(undefined)

const methodItems = computed(() => [
  { label: t('requestLog.all'), value: ALL },
  ...['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => ({ label: m, value: m })),
])

const statusClassItems = computed(() => [
  { label: t('requestLog.all'), value: ALL },
  ...['2', '3', '4', '5'].map(c => ({ label: `${c}xx`, value: c })),
])

// La select svuota la propria lista alla chiusura: l'etichetta va conservata qui.
function onUserSelect(item: Record<string, unknown>) {
  selectedUserLabel.value = String(item.email ?? '')
}

function clearUser() {
  userId.value = null
  selectedUserLabel.value = null
}

let pathTimer: ReturnType<typeof setTimeout>
watch(pathInput, (value) => {
  clearTimeout(pathTimer)
  pathTimer = setTimeout(() => { path.value = value.trim() }, PATH_DEBOUNCE_MS)
})
onBeforeUnmount(() => clearTimeout(pathTimer))

const tableParams = computed(() => ({
  with: 'user',
  user_id: userId.value ?? undefined,
  method: method.value === ALL ? undefined : method.value,
  status_class: statusClass.value === ALL ? undefined : statusClass.value,
  status: status.value || undefined,
  path: path.value || undefined,
  date_from: dateFrom.value || undefined,
  date_to: dateTo.value || undefined,
}))

function statusBadgeColor(code: number): BadgeProps['color'] {
  if (code < HTTP_SUCCESS_MAX) { return 'success' }
  if (code < HTTP_REDIRECT_MAX) { return 'info' }
  if (code < HTTP_CLIENT_ERROR_MAX) { return 'warning' }
  return 'error'
}

const columns = computed(() => [
  { accessorKey: 'created_at', header: t('requestLog.createdAt') },
  { id: 'user', header: t('requestLog.user') },
  { accessorKey: 'method', header: t('requestLog.method') },
  { accessorKey: 'path', header: t('requestLog.path') },
  { accessorKey: 'route_name', header: t('requestLog.routeName') },
  { accessorKey: 'status', header: t('requestLog.status') },
  { accessorKey: 'duration_ms', header: t('requestLog.durationMs') },
] as TableColumn<Record<string, unknown>>[])
</script>
