import { COLOR_PALETTE, COLOR_SECONDARY_MAP } from '~/utils/constants'

export function useColorPreference() {
  const appConfig = useAppConfig()
  const colorCookie = useCookie('ui-primary-color', { maxAge: 2147483647 })

  const currentPrimary = computed(() => appConfig.ui.colors.primary as string)

  function setColor(name: string) {
    appConfig.ui.colors.primary = name
    appConfig.ui.colors.secondary = COLOR_SECONDARY_MAP[name] ?? 'blue'
    colorCookie.value = name
  }

  return { palette: COLOR_PALETTE, secondaryMap: COLOR_SECONDARY_MAP, currentPrimary, setColor }
}
