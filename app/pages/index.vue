<template>
  <div />
</template>

<script setup lang="ts">
const localePath = useLocalePath()
await navigateTo(localePath('/admin'), { replace: true })
</script>
