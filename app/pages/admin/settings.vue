<template>
  <UDashboardPanel>
    <UDashboardNavbar :title="t('nav.settings')" />

    <div class="p-6 max-w-2xl flex flex-col gap-6">
      <!-- Logo applicazione -->
      <div class="flex flex-col gap-3">
        <div>
          <p class="text-sm font-semibold text-highlighted">
            {{ t('settings.logo') }}
          </p>
          <p class="text-xs text-muted">
            {{ t('settings.logoDesc') }}
          </p>
        </div>
        <div class="flex items-center gap-6">
          <div class="relative shrink-0">
            <AppLogoMark variant="boxed" size="size-20" />
            <UButton
              icon="i-mdi-trash-can-outline"
              color="error"
              variant="solid"
              size="xs"
              class="absolute -top-1.5 -right-1.5 rounded-full"
              :disabled="!currentUser?.superadmin"
              :loading="removingLogo"
              :aria-label="t('settings.logoRemove')"
              @click="() => { confirmRemoveLogoOpen = true }"
            />
          </div>
          <UFileUpload
            v-model="logoFile"
            accept="image/*"
            :disabled="!currentUser?.superadmin || uploadingLogo"
            :label="t('settings.logoUpload')"
          />
        </div>
      </div>

      <USeparator />

      <!-- Colore interfaccia -->
      <div class="flex flex-col gap-3">
        <div>
          <p class="text-sm font-semibold text-highlighted">
            {{ t('settings.appearance') }}
          </p>
          <p class="text-xs text-muted">
            {{ t('settings.appearanceDesc') }}
          </p>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          <button
            v-for="c in palette"
            :key="c.name"
            type="button"
            class="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs capitalize transition-colors focus-visible:outline-none"
            :class="currentPrimary === c.name
              ? 'border-primary bg-primary/10 text-highlighted font-semibold'
              : 'border-default text-muted hover:bg-elevated'"
            @click="setColor(c.name)"
          >
            <span class="size-3 rounded-full shrink-0" :class="c.bgClass" />
            {{ c.name }}
          </button>
        </div>
      </div>

      <USeparator />

      <!-- Modalità chiaro/scuro -->
      <div class="flex flex-col gap-3">
        <div>
          <p class="text-sm font-semibold text-highlighted">
            {{ t('settings.colorMode') }}
          </p>
          <p class="text-xs text-muted">
            {{ t('settings.colorModeDesc') }}
          </p>
        </div>
        <div class="flex gap-2">
          <UButton
            v-for="mode in colorModes"
            :key="mode.value"
            :icon="mode.icon"
            :label="mode.label"
            :variant="colorMode.preference === mode.value ? 'solid' : 'outline'"
            color="neutral"
            size="sm"
            @click="() => { colorMode.preference = mode.value }"
          />
        </div>
      </div>

      <USeparator />

      <!-- Lingua -->
      <div class="flex flex-col gap-3">
        <div>
          <p class="text-sm font-semibold text-highlighted">
            {{ t('settings.language') }}
          </p>
          <p class="text-xs text-muted">
            {{ t('settings.languageDesc') }}
          </p>
        </div>
        <div class="flex gap-2">
          <UButton
            v-for="loc in locales"
            :key="loc.code"
            :label="loc.name"
            :variant="locale === loc.code ? 'solid' : 'outline'"
            color="neutral"
            size="sm"
            @click="setLocale(loc.code)"
          />
        </div>
      </div>
    </div>
  </UDashboardPanel>

  <ClientOnly>
    <UModal v-model:open="confirmRemoveLogoOpen" :title="t('common.confirm')">
      <template #body>
        <p class="text-sm text-muted">
          {{ t('settings.logoRemoveConfirm') }}
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="() => { confirmRemoveLogoOpen = false }">
            {{ t('common.cancel') }}
          </UButton>
          <UButton color="error" :loading="removingLogo" @click="removeLogo">
            {{ t('common.delete') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </ClientOnly>
</template>

<script setup lang="ts">
import { LOGO_ADMIN_ENDPOINT } from '~/utils/constants'

const { t, locale, locales, setLocale } = useI18n()
const colorMode = useColorMode()
const { palette, currentPrimary, setColor } = useColorPreference()
const { user: currentUser } = useAuth()
const { bumpLogoVersion } = useAppLogo()
const api = useApi()
const toast = useToast()

const colorModes = computed(() => [
  { value: 'light', icon: 'i-mdi-weather-sunny', label: t('settings.light') },
  { value: 'system', icon: 'i-mdi-monitor', label: t('settings.system') },
  { value: 'dark', icon: 'i-mdi-weather-night', label: t('settings.dark') },
])

const logoFile = ref<File | null>(null)
const uploadingLogo = ref(false)
const removingLogo = ref(false)
const confirmRemoveLogoOpen = ref(false)

watch(logoFile, async (file) => {
  if (!file) { return }
  uploadingLogo.value = true
  try {
    const formData = new FormData()
    formData.append('logo', file)
    await api.upload(LOGO_ADMIN_ENDPOINT, formData)
    bumpLogoVersion()
    toast.add({ title: t('settings.logoUploadSuccess'), color: 'success' })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    uploadingLogo.value = false
    logoFile.value = null
  }
})

async function removeLogo() {
  removingLogo.value = true
  try {
    await api.del(LOGO_ADMIN_ENDPOINT)
    bumpLogoVersion()
    confirmRemoveLogoOpen.value = false
    toast.add({ title: t('settings.logoRemoveSuccess'), color: 'success' })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    removingLogo.value = false
  }
}
</script>
