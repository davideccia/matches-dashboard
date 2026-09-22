<template>
  <template v-if="variant === 'fill'">
    <div
      v-if="!collapsed && logoAvailable"
      class="w-full max-w-32 aspect-square mx-auto rounded-4xl overflow-hidden flex items-center justify-center border-4 border-primary"
    >
      <img :src="logoUrl" alt="" class="w-full h-full object-contain" @error="logoAvailable = false">
    </div>
    <div
      v-else
      :class="collapsed ? '' : 'aspect-square w-fit mx-auto flex items-center justify-center p-4 rounded-4xl border-4 border-primary'"
    >
      <UIcon
        v-if="!collapsed"
        name="i-mdi-mixed-martial-arts"
        class="text-primary"
        :class="[size]"
      />
    </div>
  </template>

  <template v-else-if="variant === 'boxed'">
    <div
      v-if="logoAvailable"
      class="mx-auto flex items-center justify-center rounded-4xl border-4 border-primary overflow-hidden"
      :class="[size, rootClass]"
    >
      <img :src="logoUrl" alt="" class="w-full h-full object-contain" @error="logoAvailable = false">
    </div>
    <div
      v-else
      class="aspect-square w-fit mx-auto flex items-center justify-center p-4 rounded-4xl border-4 border-primary"
      :class="[rootClass]"
    >
      <UIcon name="i-mdi-mixed-martial-arts" class="text-primary" :class="[size, iconClass]" />
    </div>
  </template>

  <template v-else>
    <div
      v-if="logoAvailable"
      class="rounded-4xl overflow-hidden flex items-center justify-center border-4 border-primary"
      :class="[size, rootClass]"
    >
      <img :src="logoUrl" alt="" class="w-full h-full object-contain" @error="logoAvailable = false">
    </div>
    <UIcon
      v-else
      name="i-mdi-mixed-martial-arts"
      class="text-primary"
      :class="[size, iconClass, rootClass]"
    />
  </template>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  /** Dimensione (classe Tailwind `size-*`) di icona/immagine. */
  size: string
  /** fill: riempie il contenitore (sidebar); boxed: bordo solo sul fallback; bare: nessun contenitore per l'icona. */
  variant?: 'fill' | 'boxed' | 'bare'
  /** Classi extra solo per l'icona di fallback (es. drop-shadow). */
  iconClass?: string
  /** Classi extra per il contenitore radice (es. relative z-10 sopra decorazioni). */
  rootClass?: string
  /** Solo per variant="fill": nasconde il contenuto (sidebar collassata) mantenendo il contenitore per il gesto di sblocco. */
  collapsed?: boolean
}>(), {
  variant: 'boxed',
  iconClass: '',
  rootClass: '',
  collapsed: false,
})

const { logoUrl } = useAppLogo()

// Nessun modo di sapere in anticipo se LOGO_ENDPOINT ha un'immagine (GET pubblica,
// binaria): si assume disponibile e si ricade sull'icona solo se il caricamento fallisce.
const logoAvailable = ref(true)
watch(logoUrl, () => { logoAvailable.value = true })
</script>
