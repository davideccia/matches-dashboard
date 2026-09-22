import { LOGO_PUBLIC_ENDPOINT } from '~/utils/constants'

/**
 * Logo custom opzionale, recuperato a runtime dalla GET pubblica di LOGO_PUBLIC_ENDPOINT
 * (immagine binaria diretta, 404 se non impostato). Se assente, AppLogoMark mostra
 * l'icona di default. `?v=` invalida la cache del browser dopo upload/rimozione.
 */
export function useAppLogo() {
  const { config } = useApiConfig()
  const version = useState('app-logo-version', () => 0)

  const logoUrl = computed(() => `${config.value.baseUrl}${LOGO_PUBLIC_ENDPOINT}?v=${version.value}`)

  function bumpLogoVersion() {
    version.value += 1
  }

  return { logoUrl, bumpLogoVersion }
}
