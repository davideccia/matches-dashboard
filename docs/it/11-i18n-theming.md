# 11 — i18n e temi

> Vedi anche: [03 — Struttura del progetto](03-project-structure.md), [06 — Flusso dati e livello API](06-data-flow-api.md)

Due aspetti trasversali dell'interfaccia: la **lingua** (italiano/inglese) e il **tema** (colore primario a runtime + modalità chiara/scura). La pagina che li espone all'utente è [`app/pages/admin/settings.vue`](../../app/pages/admin/settings.vue).

## Internazionalizzazione (i18n)

### Configurazione

Da [`nuxt.config.ts`](../../nuxt.config.ts) (righe 60-68):

```ts
i18n: {
  defaultLocale: 'it',
  langDir: 'locales',
  strategy: 'prefix_except_default',
  locales: [
    { code: 'it', name: 'Italiano', file: 'it.json' },
    { code: 'en', name: 'English', file: 'en.json' },
  ],
}
```

- **`defaultLocale: 'it'`** + **`strategy: 'prefix_except_default'`** → l'italiano non ha prefisso URL (`/admin/tournaments`), l'inglese sì (`/en/admin/tournaments`).
- Le traduzioni vivono in [`i18n/locales/it.json`](../../i18n/locales/it.json) e [`en.json`](../../i18n/locales/en.json).

> [!IMPORTANT]
> I due file di traduzione vanno **tenuti allineati**: ogni nuova chiave aggiunta a `it.json` deve esistere anche in `en.json` (e viceversa).

### Uso nel codice

```ts
const { t, locale, locales, setLocale } = useI18n()
```

- **`t('chiave.annidata')`** → restituisce la stringa tradotta. È ovunque nei template: `{{ t('common.save') }}`, `:title="t('nav.matchesBoard')"`.
- **`t('chiave', { var })`** → interpolazione: `t('publicMatchRecords.page', { current, total })`.
- **`locale`** → la lingua attiva (reattiva). È anche ciò che `useApi` allega come header `Accept-Language` ([Capitolo 06](06-data-flow-api.md)).
- **`useLocalePath()`** → costruisce URL con il prefisso lingua corretto, usato nel menu della sidebar e nei redirect (`localePath('/admin')`).

### Date localizzate

[`app/utils/date.ts`](../../app/utils/date.ts) formatta le date in base alla lingua, **senza** conversioni di fuso orario:

```ts
formatServerDateOnly(value, locale)  // it → DD/MM/YYYY   |  en → YYYY-MM-DD
formatServerDate(value, locale)      // + (HH:mm:ss)
serverDateToInput(value)             // ISO → valore per <input type="datetime-local">
inputDateToServer(value)             // e ritorno
```

## Tema: colore primario a runtime

I token di colore di @nuxt/ui sono impostati in [`app/app.config.ts`](../../app/app.config.ts):

```ts
ui: { colors: { primary: 'sky', secondary: 'blue', neutral: 'mist' } }
```

L'admin può però **cambiare il colore primario a runtime** dalla pagina impostazioni, e la scelta persiste in un cookie. Il meccanismo ha tre pezzi.

### 1. Le scelte valide

In [`app/utils/constants.ts`](../../app/utils/constants.ts) (righe 38-59):

```ts
export const COLOR_PALETTE = [
  { name: 'sky', bgClass: 'bg-sky-500' }, { name: 'blue', bgClass: 'bg-blue-500' },
  // … violet, pink, rose, orange, emerald, teal
] as const

export const COLOR_SECONDARY_MAP: Record<string, string> = {
  sky: 'blue', blue: 'indigo', violet: 'purple', /* … */
}
```

Ogni colore primario ha un secondario abbinato, definito da `COLOR_SECONDARY_MAP`.

### 2. Il composable `useColorPreference`

[`app/composables/useColorPreference.ts`](../../app/composables/useColorPreference.ts) applica e salva la scelta:

```ts
export function useColorPreference() {
  const appConfig = useAppConfig()
  const colorCookie = useCookie('ui-primary-color', { maxAge: 2147483647 })  // ~68 anni
  const currentPrimary = computed(() => appConfig.ui.colors.primary as string)

  function setColor(name: string) {
    appConfig.ui.colors.primary = name
    appConfig.ui.colors.secondary = COLOR_SECONDARY_MAP[name] ?? 'blue'
    colorCookie.value = name   // persiste
  }
  return { palette: COLOR_PALETTE, secondaryMap: COLOR_SECONDARY_MAP, currentPrimary, setColor }
}
```

Modificare `appConfig.ui.colors.primary` aggiorna i token del tema *a runtime*: tutta la UI che usa il colore primario cambia all'istante, senza rebuild.

### 3. Riapplicare il colore all'avvio

Un cookie da solo non basta: al caricamento dell'app bisogna rileggerlo e riapplicarlo. Lo fa il plugin [`app/plugins/color-preference.client.ts`](../../app/plugins/color-preference.client.ts):

```ts
export default defineNuxtPlugin(() => {
  const appConfig = useAppConfig()
  const saved = useCookie('ui-primary-color').value
  if (saved && COLOR_PALETTE.some(c => c.name === saved)) {  // valida contro la palette
    appConfig.ui.colors.primary = saved
    appConfig.ui.colors.secondary = COLOR_SECONDARY_MAP[saved] ?? 'blue'
  }
})
```

La guardia `COLOR_PALETTE.some(...)` ignora valori di cookie non validi (manomessi o obsoleti).

## Modalità chiara/scura

Gestita dal modulo color-mode di Nuxt, configurato con `colorMode: { preference: 'system' }` ([`nuxt.config.ts`](../../nuxt.config.ts) righe 56-58): per default segue la preferenza del sistema operativo. La pagina impostazioni espone i tre stati `light` / `system` / `dark` via `useColorMode()`:

```ts
const colorMode = useColorMode()
// nei pulsanti: colorMode.preference = 'light' | 'system' | 'dark'
```

## La pagina impostazioni

[`app/pages/admin/settings.vue`](../../app/pages/admin/settings.vue) mette insieme i tre controlli: pallini colorati per il colore primario (`setColor`), tre pulsanti per la modalità chiara/scura, e i pulsanti lingua (`setLocale`). È il punto unico dove un admin personalizza l'aspetto e la lingua dell'app.
