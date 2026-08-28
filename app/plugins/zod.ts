import * as z from 'zod'

/**
 * Zod compila gli schemi con `Function()` quando può, e per capire se può fa una
 * prova: `try { Function('') } catch { jitless = true }`. Sotto la nostra CSP quella
 * prova viene bloccata — Zod ripiega correttamente sul validatore interpretato, ma il
 * browser logga una violazione `unsafe-eval` a ogni caricamento.
 *
 * Dichiarare `jitless` salta la prova: stesso comportamento, console pulita.
 */
export default defineNuxtPlugin(() => {
  z.config({ jitless: true })
})
