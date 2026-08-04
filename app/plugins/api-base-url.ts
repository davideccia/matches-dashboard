import type { FetchContext } from 'ofetch'

// nuxt-auth-sanctum non tipizza i propri hook: lo dichiariamo qui.
declare module '#app' {
  interface RuntimeNuxtHooks {
    'sanctum:request': (nuxtApp: unknown, context: FetchContext) => void
  }
}

/**
 * Riscrive la baseURL del client Sanctum a ogni richiesta, così l'override
 * runtime di useApiConfig() vale anche se il client è creato una volta sola.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('sanctum:request', (_nuxtApp, context) => {
    context.options.baseURL = useApiConfig().config.value.baseUrl
  })
})
