<template>
  <ApiEnvironmentUnlock v-if="unlockable">
    <AppLogoMark v-bind="markProps" />
  </ApiEnvironmentUnlock>
  <AppLogoMark v-else v-bind="markProps" />
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  size: string
  variant?: 'fill' | 'boxed' | 'bare'
  iconClass?: string
  rootClass?: string
  collapsed?: boolean
  /** Se true, il logo attiva il gesto nascosto (5 click) che apre l'ApiEnvironmentSwitcher. */
  unlockable?: boolean
}>(), {
  variant: 'boxed',
  iconClass: '',
  rootClass: '',
  collapsed: false,
  unlockable: false,
})

const markProps = computed(() => ({
  size: props.size,
  variant: props.variant,
  iconClass: props.iconClass,
  rootClass: props.rootClass,
  collapsed: props.collapsed,
}))
</script>
