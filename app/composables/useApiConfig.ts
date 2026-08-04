import { API_ENDPOINTS } from '~/utils/constants'

const STORAGE_KEY = 'matches.api-override'

export interface ApiConfig {
  baseUrl: string
  reverbAppKey: string
  reverbHost: string
  reverbPort: string
  reverbScheme: string
}

/**
 * Risolve la configurazione API/Reverb con precedenza:
 * override in localStorage (runtime) → valori baked at build → default in constants.
 * L'override è per-browser: serve a ripuntare un build statico (Amplify) senza rebuild.
 */
export function useApiConfig() {
  const { public: cfg } = useRuntimeConfig()

  const build = computed<ApiConfig>(() => ({
    baseUrl: (cfg.sanctum.baseUrl as string) || API_ENDPOINTS[0],
    reverbAppKey: cfg.reverbAppKey,
    reverbHost: cfg.reverbHost,
    reverbPort: String(cfg.reverbPort),
    reverbScheme: cfg.reverbScheme,
  }))

  // ssr: false ⇒ l'initializer gira solo lato client, localStorage è disponibile.
  const override = useState<Partial<ApiConfig> | null>(STORAGE_KEY, () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    } catch {
      return null
    }
  })

  const config = computed<ApiConfig>(() => ({ ...build.value, ...(override.value ?? {}) }))
  /** Un override è attivo in questo browser (≠ "non siamo in produzione"). */
  const hasOverride = computed(() => override.value !== null)
  const isProduction = computed(() => config.value.baseUrl === API_ENDPOINTS[0])

  /** Il reload è necessario: Echo apre la connessione una volta sola all'init del plugin. */
  function setOverride(values: Partial<ApiConfig>, reload = true) {
    override.value = values
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values))
    if (reload) { location.reload() }
  }

  function resetOverride(reload = true) {
    override.value = null
    localStorage.removeItem(STORAGE_KEY)
    if (reload) { location.reload() }
  }

  return { config, build, endpoints: API_ENDPOINTS, hasOverride, isProduction, setOverride, resetOverride }
}
