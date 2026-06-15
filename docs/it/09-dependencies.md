# 09 — Dipendenze

> Vedi anche: [03 — Build, Run, Test](03-build-run-test.md), [11 — Glossario](11-glossary.md).

L'elenco delle dipendenze è volutamente piccolo: un framework, una libreria di componenti, due librerie trasversali (i18n, validazione) e una libreria di trasporto (STOMP). Tutto il resto è strumentazione di sviluppo.

## Dipendenze runtime

| Pacchetto                  | Versione  | Ruolo                                                                                                |
|----------------------------|-----------|------------------------------------------------------------------------------------------------------|
| `nuxt`                     | `^4.4.6`  | Il framework: routing basato sui file, auto-import, pipeline di build, sistema di plugin.            |
| `vue`                      | `^3.5.34` | La libreria UI reattiva su cui poggia Nuxt. Composition API usata ovunque.                           |
| `vue-router`               | `^5.0.7`  | Il router usato da Nuxt (transitivo ma fissato).                                                     |
| `@nuxt/ui`                 | `^4.8.0`  | 125+ componenti Vue accessibili (`UButton`, `UTable`, `USlideover`, `UForm`, …) con token di tema.   |
| `reka-ui`                  | `^2.9.9`  | Primitive headless e accessibili su cui si appoggia `@nuxt/ui` (≈ Radix UI per Vue). Raramente usato direttamente. |
| `tailwindcss`              | `^4.3.0`  | CSS utility-first. La v4 usa una config CSS-first (`@theme` in `main.css` al posto di un file JS).   |
| `@nuxtjs/i18n`             | `^10.4.0` | Routing per locale, `useI18n()`, `useLocalePath()`. Configurato in `nuxt.config.ts` con `it` + `en`. |
| `zod`                      | `^4.4.3`  | Validazione di schemi per i form. Gli schemi sono anche tipi TypeScript via `z.infer<typeof s>`.     |
| `moment`                   | `^2.30.1` | Utility di formattazione date. Usata solo in `app/utils/date.ts` per convertire tra stringhe ISO, valori HTML `datetime-local` e stringhe di visualizzazione localizzate. |
| `@internationalized/date`  | `^3.12.2` | Oggetti valore per date di calendario tipizzati (es. `CalendarDate`). Richiesto dai componenti date-picker di `@nuxt/ui`. |
| `@stomp/stompjs`           | `^7.3.0`  | Client STOMP-su-WebSocket. Usato solo nello scoreboard pubblico. Vedi [06](06-external-integrations.md). |

## Dipendenze di sviluppo

| Pacchetto                        | Ruolo                                                                          |
|----------------------------------|--------------------------------------------------------------------------------|
| `typescript` `^6.0.3`            | Type checker. Eseguito con `pnpm nuxi typecheck`.                              |
| `eslint` + `@antfu/eslint-config`| Regole di lint (apici singoli, niente punto e virgola, import ordinati). Esegui `pnpm eslint . --fix`. |
| `@nuxt/eslint`                   | Integrazione ESLint consapevole di Nuxt; espone le globali degli auto-import a ESLint. |
| `@intlify/eslint-plugin-vue-i18n`| Trova chiavi i18n non usate / mancanti tra `it.json` e `en.json`.              |
| `eslint-plugin-format`           | Regole di formattazione esterne a Prettier.                                    |
| `eslint-plugin-vuetify`          | Plugin legacy da una precedente era Vuetify — presente ma inattivo con `@nuxt/ui`. |
| `@iconify-json/heroicons`        | Set di icone Heroicons (referenziate come `i-heroicons-*`).                    |
| `@iconify-json/mdi`              | Set di icone Material Design Icons (referenziate come `i-mdi-*`). La maggior parte delle icone in questa app usa il prefisso `mdi`. |

## Cose che ci si potrebbe aspettare ma non ci sono

- **Nessuna libreria di state management.** Niente Pinia, niente Vuex, niente Redux. Lo stato condiviso sono ref chiavate via `useState`. Vedi [05](05-data-flow.md).
- **Nessun client HTTP.** `$fetch` (incluso in Nuxt) avvolto da `useApi()` è l'unico.
- **Nessun framework di test.** Niente Vitest, niente Playwright, niente Cypress. Solo verifica manuale.
- **Niente CSS-in-JS / styled-components.** Utility Tailwind ovunque; i componenti `@nuxt/ui` gestiscono il proprio tema tramite token.
- **Nessun SDK di analytics, nessun error tracking.** Eventuali aggiunte future andranno in un file plugin.
