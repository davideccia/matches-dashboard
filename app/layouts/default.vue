<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible resizable>
      <template #default="{ collapsed }">
        <ApiEnvironmentUnlock>
          <div
            class="aspect-square w-fit mx-auto flex items-center justify-center p-4 rounded-4xl border-4 border-primary"
          >
            <UIcon
              name="i-mdi-mixed-martial-arts"
              :class="collapsed ? 'size-10' : 'size-24'"
              class="text-primary"
            />
          </div>
        </ApiEnvironmentUnlock>
        <UNavigationMenu
          :collapsed="collapsed"
          :items="items"
          orientation="vertical"
          popover
          class="data-[collapsed=true]:items-center"
        />
      </template>

      <template #footer="{ collapsed }">
        <UDropdownMenu :items="userMenuItems" :ui="{ content: 'min-w-48' }">
          <UButton
            variant="ghost"
            color="neutral"
            class="w-full"
            :class="collapsed ? 'justify-center' : 'gap-2 px-2'"
          >
            <UAvatar :text="userInitials" size="2xs" color="neutral" />
            <span
              v-if="!collapsed"
              class="text-xs text-muted truncate flex-1 text-left"
            >{{ user?.email }}</span>
            <UIcon
              v-if="!collapsed"
              name="i-mdi-unfold-more-vertical"
              class="text-dimmed size-3 shrink-0"
            />
          </UButton>
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>

    <div class="relative flex-1 min-w-0 flex flex-col">
      <slot />

      <div
        class="absolute bottom-0 inset-x-0 z-50 h-10 flex items-center justify-end px-4 bg-default border-t border-default"
      >
        <UBadge variant="outline" size="sm">
          v{{ appConfig.version }}
        </UBadge>
      </div>
    </div>
  </UDashboardGroup>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { t } = useI18n()
const appConfig = useAppConfig()
const localePath = useLocalePath()
const { user, logout } = useAuth()
const { config } = useApiConfig()

/** Le viste Horizon / Log Viewer sono servite dall'API Laravel, non da questa SPA. */
const apiBaseUrl = computed(() => config.value.baseUrl.replace(/\/+$/, ''))
const horizonUrl = computed(() => `${apiBaseUrl.value}/horizon`)
const logViewerUrl = computed(() => `${apiBaseUrl.value}/log-viewer`)

const items = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: t('nav.home'),
      icon: 'i-mdi-home',
      to: localePath('/admin'),
    },
    {
      label: t('nav.tournaments'),
      icon: 'i-mdi-trophy',
      to: localePath('/admin/tournaments'),
    },
    {
      label: t('nav.athletes'),
      icon: 'i-mdi-run',
      to: localePath('/admin/configurations/athletes'),
    },
    {
      label: t('nav.configurations'),
      icon: 'i-mdi-tune-vertical-variant',
      defaultOpen: true,
      children: [
        {
          label: t('nav.disciplines'),
          icon: 'i-mdi-sword-cross',
          to: localePath('/admin/configurations/disciplines'),
        },
        {
          label: t('nav.weightCategories'),
          icon: 'i-mdi-scale-balance',
          to: localePath('/admin/configurations/weight_categories'),
        },
        {
          label: t('nav.experienceTiers'),
          icon: 'i-mdi-stairs',
          to: localePath('/admin/configurations/experience_tiers'),
        },
      ],
    },
  ],
  [
    {
      label: t('nav.users'),
      icon: 'i-mdi-account-group',
      to: localePath('/admin/configurations/users'),
    },
    {
      label: t('nav.settings'),
      icon: 'i-mdi-cog',
      to: localePath('/admin/settings'),
    },
  ],
])

const userInitials = computed(() => {
  const email = user.value?.email ?? ''
  return email.slice(0, 2).toUpperCase()
})

const userMenuItems = computed(() => [
  ...(user.value?.superadmin
    ? [
        [
          {
            label: t('nav.horizon'),
            icon: 'i-mdi-speedometer',
            to: horizonUrl.value,
            target: '_blank',
            rel: 'noopener noreferrer',
            color: 'primary' as const,
          },
          {
            label: t('nav.logViewer'),
            icon: 'i-mdi-text-box',
            to: logViewerUrl.value,
            target: '_blank',
            rel: 'noopener noreferrer',
            color: 'primary' as const,
          },
        ],
      ]
    : []),
  [
    {
      label: t('nav.logout'),
      icon: 'i-mdi-logout',
      color: 'error' as const,
      onSelect: logout,
    },
  ],
])
</script>
