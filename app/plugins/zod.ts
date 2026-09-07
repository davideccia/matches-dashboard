import * as z from 'zod'

/**
 * Zod compila gli schemi con `Function()` quando può, e per capire se può fa una
 * prova: `try { Function('') } catch { jitless = true }`. Sotto la nostra CSP quella
 * prova viene bloccata — Zod ripiega correttamente sul validatore interpretato, ma il
 * browser logga una violazione `unsafe-eval` a ogni caricamento.
 *
 * Dichiarare `jitless` salta la prova: stesso comportamento, console pulita.
 */

const ZOD_LOCALES = {
  it: z.locales.it,
  en: z.locales.en,
} as const

function applyZodLocale(locale: string): void {
  const localeFactory = ZOD_LOCALES[locale as keyof typeof ZOD_LOCALES] ?? ZOD_LOCALES.it

  z.config({ jitless: true, localeError: localeFactory().localeError })
}

export default defineNuxtPlugin((nuxtApp) => {
  const locale = nuxtApp.$i18n.locale

  applyZodLocale(locale.value)

  watch(locale, (newLocale) => {
    applyZodLocale(newLocale)
  })
})
