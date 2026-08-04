<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible resizable>
      <template #default="{ collapsed }">
        <img
          src="~/assets/logo.png"
          :class="collapsed ? 'size-10 mx-auto rounded-xl' : 'h-24 w-auto mx-auto rounded-xl border-4'"
          class="object-contain border-primary"
          alt="logo"
        >
        <div v-if="!collapsed" class="text-center">
          <UBadge variant="outline">
            v{{ appConfig.version }}
          </UBadge>
        </div>
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
            <span v-if="!collapsed" class="text-xs text-muted truncate flex-1 text-left">{{ user?.email }}</span>
            <UIcon v-if="!collapsed" name="i-mdi-unfold-more-vertical" class="text-dimmed size-3 shrink-0" />
          </UButton>
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { t } = useI18n()
const appConfig = useAppConfig()
const localePath = useLocalePath()
const { user, logout } = useAuth()

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
          label: t('nav.users'),
          icon: 'i-mdi-account-group',
          to: localePath('/admin/configurations/users'),
        },
      ],
    },
  ],
  [
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

const userMenuItems = computed(() => [[
  {
    label: t('nav.logout'),
    icon: 'i-mdi-logout',
    color: 'error' as const,
    onSelect: logout,
  },
]])
</script>
