<template>
  <!--
    <div> e non <label>: un click su un elemento interno al bottone (es. l'icona)
    verrebbe ri-inoltrato dal <label> al controllo, facendo scattare due click.
    Non UFormField: propaga la size ai campi figli.
  -->
  <div role="group" :aria-labelledby="labelId" class="flex flex-col gap-1 min-w-0">
    <span :id="labelId" class="text-xs text-muted">{{ label }}</span>
    <slot />
  </div>
</template>

<script setup lang="ts">
// Etichetta compatta sopra un filtro di DataTable (fuori dal campo, non come placeholder).
defineProps<{
  label: string
}>()

const labelId = useId()
</script>
