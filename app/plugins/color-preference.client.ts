import { COLOR_PALETTE, COLOR_SECONDARY_MAP } from '~/utils/constants'

export default defineNuxtPlugin(() => {
  const appConfig = useAppConfig()
  const colorCookie = useCookie('ui-primary-color')

  const saved = colorCookie.value
  if (saved && COLOR_PALETTE.some(c => c.name === saved)) {
    appConfig.ui.colors.primary = saved
    appConfig.ui.colors.secondary = COLOR_SECONDARY_MAP[saved] ?? 'blue'
  }
})
