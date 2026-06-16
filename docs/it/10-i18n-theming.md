# 10 — Internazionalizzazione e temi

Due aspetti trasversali chiudono il giro: come l'app gestisce più lingue e come permette all'utente di ricolorare l'interfaccia e passare tra modalità chiara/scura.

## Internazionalizzazione (i18n)

**i18n** = *internazionalizzazione* (≈ far parlare l'app in più di una lingua). È gestita dal modulo `@nuxtjs/i18n`, configurato in [`nuxt.config.ts`](../../nuxt.config.ts):

```ts
i18n: {
  defaultLocale: 'it',
  langDir: 'locales',
  strategy: 'prefix_except_default',
  locales: [
    { code: 'it', name: 'Italiano', file: 'it.json' },
    { code: 'en', name: 'English',  file: 'en.json' },
  ],
}
```

Fatti chiave:

- **L'italiano è il default.** Con `strategy: 'prefix_except_default'`, gli URL italiani *non* hanno prefisso (`/admin/settings`) e quelli inglesi hanno il prefisso `/en/` (`/en/admin/settings`).
- **I file di traduzione** vivono in [`i18n/locales/it.json`](../../i18n/locales/it.json) e [`en.json`](../../i18n/locales/en.json). Sono oggetti JSON annidati raggruppati per funzionalità: `nav.*`, `common.*`, `login.*`, `athlete.*`, `publicMatchRecords.*`, `dashboard.*`, ecc.

### Usare le traduzioni nel codice

In un componente chiami `useI18n()`:

```ts
const { t, locale } = useI18n()
// t('athlete.firstName')              → stringa risolta
// t('publicMatchRecords.page', { current, total })  → con interpolazione
// locale.value                        → 'it' | 'en' (inviato anche come Accept-Language da useApi)
```

`t(key)` risolve un percorso a punti nel JSON della lingua attiva. Poiché le intestazioni di colonna, le etichette e le opzioni sono avvolte in `computed(() => t(...))`, la UI si ritraduce istantaneamente al cambio di lingua.

Per la navigazione che deve rispettare il prefisso di lingua, usa `useLocalePath()`:

```ts
const localePath = useLocalePath()
localePath('/admin/tournaments')   // → '/admin/tournaments' (it) o '/en/admin/tournaments' (en)
```

La sidebar in [`layouts/default.vue`](../../app/layouts/default.vue) costruisce così ogni link di menu. Il componente [`LocaleSwitcher.vue`](../../app/components/LocaleSwitcher.vue) consente all'utente di cambiare lingua.

> [!IMPORTANT]
> **`it.json` ed `en.json` vanno mantenuti sincronizzati.** Ogni nuova stringa della UI ha bisogno di una chiave aggiunta in *entrambi* i file. Il linter `@intlify/eslint-plugin-vue-i18n` (configurato nel setup ESLint) segnalerà chiavi mancanti o inutilizzate.

### Localizzazione delle date

Anche la visualizzazione delle date è consapevole della lingua, tramite gli helper in [`app/utils/date.ts`](../../app/utils/date.ts) — l'italiano mostra `DD/MM/YYYY`, l'inglese `YYYY-MM-DD`. Vedi il [Capitolo 07](07-data-flow-api.md).

## Temi: colori

Il colore di accento della UI è modificabile dall'utente a runtime. I default sono impostati in [`app/app.config.ts`](../../app/app.config.ts):

```ts
ui: { colors: { primary: 'sky', secondary: 'blue', neutral: 'mist' } }
```

`app.config.ts` è una configurazione reattiva a runtime (distinta da `nuxt.config.ts`, che è in fase di build). La palette di scelte e la mappatura del colore secondario sono in [`constants.ts`](../../app/utils/constants.ts):

```ts
COLOR_PALETTE = [ { name: 'sky', bgClass: 'bg-sky-500' }, … 'blue','violet','pink','rose','orange','emerald','teal' ]
COLOR_SECONDARY_MAP = { sky: 'blue', blue: 'indigo', violet: 'purple', … }
```

### Come si persiste un cambio di colore: `useColorPreference`

[`app/composables/useColorPreference.ts`](../../app/composables/useColorPreference.ts) lega tutto insieme:

```ts
export function useColorPreference() {
  const appConfig = useAppConfig()
  const colorCookie = useCookie('ui-primary-color', { maxAge: 2147483647 })  // ~68 anni

  function setColor(name: string) {
    appConfig.ui.colors.primary = name                               // applica subito
    appConfig.ui.colors.secondary = COLOR_SECONDARY_MAP[name] ?? 'blue'
    colorCookie.value = name                                         // persiste
  }
  return { palette: COLOR_PALETTE, secondaryMap, currentPrimary, setColor }
}
```

- `setColor()` aggiorna l'`appConfig` dal vivo (così `@nuxt/ui` ricolora istantaneamente) **e** scrive un cookie a lunga durata `ui-primary-color`.
- All'avvio, [`plugins/color-preference.client.ts`](../../app/plugins/color-preference.client.ts) legge quel cookie e riapplica il colore salvato, così la scelta sopravvive ai ricaricamenti.

L'utente cambia il colore dalla pagina Impostazioni (`/admin/settings`).

## Temi: modalità chiara / scura

La modalità chiara/scura è gestita dal `colorMode` integrato di Nuxt, configurato in `nuxt.config.ts`:

```ts
colorMode: { preference: 'system' }
```

Segue di default la preferenza del sistema operativo. Il componente [`ColorModeSwitcher.vue`](../../app/components/ColorModeSwitcher.vue) consente all'utente di sovrascriverla manualmente. I token di colore semantici di `@nuxt/ui` (`bg-default`, `bg-elevated`, `text-muted`, `border-default`, ecc. — visti in tutti i template) si adattano automaticamente alla modalità attiva, così i singoli componenti non hanno bisogno di rami chiaro/scuro.
