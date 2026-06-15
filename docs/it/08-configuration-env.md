# 08 — Configurazione e Env

> Vedi anche: [01 — Panoramica](01-overview.md), [03 — Build, Run, Test](03-build-run-test.md).

La configurazione vive in tre posti: build-time (`nuxt.config.ts`), stato UI a runtime (`app.config.ts`) e preferenze per utente (`localStorage`). Sapere quale è quale evita due sorprese comuni: variabili d'ambiente che non si aggiornano in produzione e modifiche al tema che non si persistono.

## `nuxt.config.ts` — config framework al build-time

Questo file viene letto una sola volta, al momento della build. Modificarlo richiede una nuova build.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,                      // SPA statica — nessun server Node in prod
  modules: ['@nuxt/ui', '@nuxtjs/i18n', '@nuxt/eslint'],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:8081',
    },
  },
  css: ['~/assets/css/main.css'],
  vite: { optimizeDeps: { include: ['@vue/devtools-core', '@vue/devtools-kit', '@stomp/stompjs', 'zod'] } },
  colorMode: { preference: 'system' },
  i18n: {
    defaultLocale: 'it',
    langDir: 'locales',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'it', name: 'Italiano', file: 'it.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
  },
})
```

### `runtimeConfig.public.apiBase`

Con `ssr: false`, **`process.env` viene letto solo al momento della build**. Il valore di `NUXT_PUBLIC_API_BASE` nel momento in cui si esegue `pnpm build` (o `docker build --build-arg`) è incorporato nel bundle. Non c'è alcun file `.env` consultato a runtime.

Questa è una scelta voluta — in produzione non c'è alcun processo Node che possa leggere le variabili d'ambiente. Per puntare a un backend diverso, si rifà la build con un `NUXT_PUBLIC_API_BASE` diverso.

In codice, lo si legge con `useRuntimeConfig()`:

```ts
const { public: { apiBase } } = useRuntimeConfig()
```

### Strategia i18n

`prefix_except_default` significa che l'italiano (il default) ha URL puliti e l'inglese è prefissato con `/en/`. Vedi [04](04-ui-navigation.md).

### Color mode

`colorMode: { preference: 'system' }` fa seguire light/dark al sistema operativo. L'utente può forzare la scelta tramite `ColorModeSwitcher.vue`; la preferenza è salvata da `@nuxtjs/color-mode` in un cookie/localStorage.

## `app.config.ts` — config UI reattiva

Questo è *diverso* da `nuxt.config.ts`. È un piccolo oggetto reattivo disponibile in tutta l'app tramite `useAppConfig()`. La libreria `@nuxt/ui` legge da qui i suoi token colore.

```ts
// app/app.config.ts
import pkg from '../package.json'

export default defineAppConfig({
  ui: {
    colors: {
      primary: 'sky',
      secondary: 'blue',
      neutral: 'mist',
    },
  },
  version: pkg.version,
})
```

Mutare `appConfig.ui.colors.primary` a runtime innesca una ri-renderizzazione con il nuovo tema. Questo è ciò che fa la pagina Impostazioni.

## Preferenze per utente in `localStorage`

Il browser conserva tre chiavi:

| Chiave               | Impostata da                        | Scopo                                          |
|----------------------|-------------------------------------|------------------------------------------------|
| `auth-token`         | `useAuth().login()` / plugin        | Bearer token JWT                               |
| `auth-user`          | `useAuth().login()` / plugin        | Utente corrente serializzato                   |
| `ui-primary-color`   | `useColorPreference().setColor()`   | Override del colore primario (es. `'emerald'`) |

`useColorPreference()` legge il colore salvato al mount e lo applica all'`appConfig`:

```ts
// app/composables/useColorPreference.ts
onMounted(() => {
  const saved = localStorage.getItem('ui-primary-color')
  if (saved && COLOR_PALETTE.some(c => c.name === saved)) {
    setColor(saved)
  }
})
```

Non c'è alcun database client, niente IndexedDB, niente service worker — `localStorage` è l'intera storia della persistenza lato client. Le preferenze di auth e di colore sono le uniche cose che sopravvivono a un reload.

## Cosa *non* è configurabile

- I path degli endpoint Spring Boot (`/api/desktop/...`, `/ws`) sono hardcoded nelle chiamate e nel setup STOMP.
- L'insieme delle locale (`it`, `en`) è fisso in `nuxt.config.ts`.
- La palette dei colori (`COLOR_PALETTE` in `constants.ts`) e la corrispondente `COLOR_SECONDARY_MAP` sono gli unici colori primari validi.
