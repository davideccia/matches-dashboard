<template>
  <span class="contents" @click="onActivate">
    <slot />
  </span>

  <ClientOnly>
    <UModal v-model:open="open" :title="t('settings.apiEnvironment')">
      <template #body>
        <ApiEnvironmentSwitcher v-if="unlocked" />

        <UForm
          v-else
          :schema="schema"
          :state="state"
          class="flex flex-col gap-4"
          @submit="onUnlock"
        >
          <UFormField name="password" :label="t('settings.apiEnvironmentPassword')" required>
            <UInput
              v-model="state.password"
              type="password"
              autofocus
              class="w-full"
            />
          </UFormField>

          <UAlert
            v-if="wrong"
            color="error"
            variant="soft"
            icon="i-mdi-alert-circle"
            :description="t('settings.apiEnvironmentPasswordWrong')"
          />

          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="outline"
              :label="t('common.cancel')"
              @click="open = false"
            />
            <UButton type="submit" :label="t('common.confirm')" />
          </div>
        </UForm>
      </template>
    </UModal>
  </ClientOnly>
</template>

<script setup lang="ts">
import * as z from 'zod'

const CLICKS_REQUIRED = 5
const CLICK_WINDOW_MS = 1500

const { t } = useI18n()
// String() obbligatorio: Nuxt passa le env var per destr, quindi una password
// tutta cifre ("12345678") arriva qui come number e === con la stringa digitata
// fallirebbe sempre. Coercizione prima del check di truthiness, così anche le
// password "0" e "false" (che destr rende falsy) restano valide.
const expectedPassword = String(useRuntimeConfig().public.envSwitcherPassword ?? '')

const open = ref(false)
const unlocked = ref(false)
const wrong = ref(false)

const schema = z.object({ password: z.string().min(1) })
const state = reactive({ password: '' })

const count = ref(0)
let resetTimer: ReturnType<typeof setTimeout> | undefined

/** Gesto nascosto: N click ravvicinati sull'attivatore. */
function onActivate() {
  // Fail closed: senza password configurata il gesto non esiste.
  if (!expectedPassword) { return }

  clearTimeout(resetTimer)
  count.value++

  if (count.value >= CLICKS_REQUIRED) {
    count.value = 0
    open.value = true
    return
  }

  resetTimer = setTimeout(() => { count.value = 0 }, CLICK_WINDOW_MS)
}

function onUnlock() {
  unlocked.value = state.password === expectedPassword
  wrong.value = !unlocked.value
  state.password = ''
}

// Riaprire il modal deve richiedere di nuovo la password.
watch(open, (value) => {
  if (!value) {
    unlocked.value = false
    wrong.value = false
    state.password = ''
  }
})

onUnmounted(() => clearTimeout(resetTimer))
</script>
