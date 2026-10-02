<template>
  <FilterField :label="label" class="items-center">
    <UTooltip :text="stateLabel">
      <UButton
        :icon="STATE_ICON[stateKey]"
        :color="STATE_COLOR[stateKey]"
        :variant="model === null ? 'outline' : 'subtle'"
        square
        class="size-8 justify-center"
        :aria-label="`${label}: ${stateLabel}`"
        @click="cycle"
      />
    </UTooltip>
  </FilterField>
</template>

<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

defineProps<{
  label: string
}>()

// Filtro booleano a tre stati: null (tutti) → true (sì) → false (no) → null.
// Resa tipo checkbox: vuoto / V / X, con l'etichetta sopra come gli altri filtri.
const model = defineModel<boolean | null>({ required: true })

type StateKey = 'all' | 'yes' | 'no'

const STATE_ICON: Record<StateKey, string | undefined> = {
  all: undefined,
  yes: 'i-mdi-check',
  no: 'i-mdi-close',
}

const STATE_COLOR: Record<StateKey, ButtonProps['color']> = {
  all: 'neutral',
  yes: 'success',
  no: 'error',
}

const { t } = useI18n()

const stateKey = computed<StateKey>(() => {
  if (model.value === null) { return 'all' }
  return model.value ? 'yes' : 'no'
})

const stateLabel = computed(() => ({
  all: t('common.all'),
  yes: t('common.yes'),
  no: t('common.no'),
})[stateKey.value])

function cycle() {
  model.value = model.value === null ? true : model.value ? false : null
}
</script>
