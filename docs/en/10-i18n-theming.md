# 10 — Internationalisation & Theming

Two cross-cutting concerns finish the tour: how the app handles multiple languages, and how it lets the user re-colour the interface and switch light/dark mode.

## Internationalisation (i18n)

**i18n** = *internationalisation* (≈ making the app speak more than one language). It's handled by the `@nuxtjs/i18n` module, configured in [`nuxt.config.ts`](../../nuxt.config.ts):

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

Key facts:

- **Italian is the default.** With `strategy: 'prefix_except_default'`, Italian URLs have *no* prefix (`/admin/settings`) and English URLs are prefixed with `/en/` (`/en/admin/settings`).
- **Translation files** live in [`i18n/locales/it.json`](../../i18n/locales/it.json) and [`en.json`](../../i18n/locales/en.json). They are nested JSON objects grouped by feature: `nav.*`, `common.*`, `login.*`, `athlete.*`, `publicMatchRecords.*`, `dashboard.*`, etc.

### Using translations in code

In a component you call `useI18n()`:

```ts
const { t, locale } = useI18n()
// t('athlete.firstName')              → looked-up string
// t('publicMatchRecords.page', { current, total })  → with interpolation
// locale.value                        → 'it' | 'en' (also sent as Accept-Language by useApi)
```

`t(key)` resolves a dot-path into the active locale's JSON. Because column headers, labels, and options are wrapped in `computed(() => t(...))`, the UI re-translates instantly when the locale changes.

For navigation that must respect the locale prefix, use `useLocalePath()`:

```ts
const localePath = useLocalePath()
localePath('/admin/tournaments')   // → '/admin/tournaments' (it) or '/en/admin/tournaments' (en)
```

The sidebar in [`layouts/default.vue`](../../app/layouts/default.vue) builds every menu link this way. The [`LocaleSwitcher.vue`](../../app/components/LocaleSwitcher.vue) component lets the user change language.

> [!IMPORTANT]
> **Both `it.json` and `en.json` must be kept in sync.** Every new UI string needs a key added to *both* files. The `@intlify/eslint-plugin-vue-i18n` linter (configured in the ESLint setup) will flag missing or unused keys.

### Date localisation

Date display is locale-aware too, via the helpers in [`app/utils/date.ts`](../../app/utils/date.ts) — Italian shows `DD/MM/YYYY`, English `YYYY-MM-DD`. See [Chapter 07](07-data-flow-api.md).

## Theming: colours

The UI's accent colour is user-changeable at runtime. The defaults are set in [`app/app.config.ts`](../../app/app.config.ts):

```ts
ui: { colors: { primary: 'sky', secondary: 'blue', neutral: 'mist' } }
```

`app.config.ts` is a reactive runtime config (distinct from `nuxt.config.ts`, which is build-time). The palette of choices and the secondary-colour mapping are in [`constants.ts`](../../app/utils/constants.ts):

```ts
COLOR_PALETTE = [ { name: 'sky', bgClass: 'bg-sky-500' }, … 'blue','violet','pink','rose','orange','emerald','teal' ]
COLOR_SECONDARY_MAP = { sky: 'blue', blue: 'indigo', violet: 'purple', … }
```

### How a colour change persists: `useColorPreference`

[`app/composables/useColorPreference.ts`](../../app/composables/useColorPreference.ts) ties it together:

```ts
export function useColorPreference() {
  const appConfig = useAppConfig()
  const colorCookie = useCookie('ui-primary-color', { maxAge: 2147483647 })  // ~68 years

  function setColor(name: string) {
    appConfig.ui.colors.primary = name                               // applies immediately
    appConfig.ui.colors.secondary = COLOR_SECONDARY_MAP[name] ?? 'blue'
    colorCookie.value = name                                         // persists
  }
  return { palette: COLOR_PALETTE, secondaryMap, currentPrimary, setColor }
}
```

- `setColor()` updates the live `appConfig` (so `@nuxt/ui` recolours instantly) **and** writes a long-lived cookie `ui-primary-color`.
- On startup, [`plugins/color-preference.client.ts`](../../app/plugins/color-preference.client.ts) reads that cookie and re-applies the saved colour, so the choice survives reloads.

The user changes the colour from the Settings page (`/admin/settings`).

## Theming: light / dark mode

Light/dark is handled by Nuxt's built-in `colorMode`, configured in `nuxt.config.ts`:

```ts
colorMode: { preference: 'system' }
```

It follows the operating system's preference by default. The [`ColorModeSwitcher.vue`](../../app/components/ColorModeSwitcher.vue) component lets the user override it manually. `@nuxt/ui`'s semantic colour tokens (`bg-default`, `bg-elevated`, `text-muted`, `border-default`, etc. — seen throughout the templates) automatically adapt to the active mode, so individual components don't need light/dark branching.
