# 11 — i18n & theming

> See also: [03 — Project structure](03-project-structure.md), [06 — Data flow & the API layer](06-data-flow-api.md)

Two cross-cutting aspects of the interface: the **language** (Italian/English) and the **theme** (runtime primary colour + light/dark mode). The page that exposes them to the user is [`app/pages/admin/settings.vue`](../../app/pages/admin/settings.vue).

## Internationalisation (i18n)

### Configuration

From [`nuxt.config.ts`](../../nuxt.config.ts) (lines 60-68):

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

- **`defaultLocale: 'it'`** + **`strategy: 'prefix_except_default'`** → Italian has no URL prefix (`/admin/tournaments`), English does (`/en/admin/tournaments`).
- Translations live in [`i18n/locales/it.json`](../../i18n/locales/it.json) and [`en.json`](../../i18n/locales/en.json).

> [!IMPORTANT]
> The two translation files must be **kept in sync**: every new key added to `it.json` must also exist in `en.json` (and vice versa).

### Usage in code

```ts
const { t, locale, locales, setLocale } = useI18n()
```

- **`t('nested.key')`** → returns the translated string. It's everywhere in templates: `{{ t('common.save') }}`, `:title="t('nav.matchesBoard')"`.
- **`t('key', { var })`** → interpolation: `t('publicMatchRecords.page', { current, total })`.
- **`locale`** → the active language (reactive). It's also what `useApi` attaches as the `Accept-Language` header ([Chapter 06](06-data-flow-api.md)).
- **`useLocalePath()`** → builds URLs with the correct language prefix, used in the sidebar menu and redirects (`localePath('/admin')`).

### Localised dates

[`app/utils/date.ts`](../../app/utils/date.ts) formats dates by language, **without** timezone conversion:

```ts
formatServerDateOnly(value, locale)  // it → DD/MM/YYYY   |  en → YYYY-MM-DD
formatServerDate(value, locale)      // + (HH:mm:ss)
serverDateToInput(value)             // ISO → value for <input type="datetime-local">
inputDateToServer(value)             // and back
```

## Theme: runtime primary colour

The @nuxt/ui colour tokens are set in [`app/app.config.ts`](../../app/app.config.ts):

```ts
ui: { colors: { primary: 'sky', secondary: 'blue', neutral: 'mist' } }
```

The admin can, however, **change the primary colour at runtime** from the settings page, and the choice persists to a cookie. The mechanism has three pieces.

### 1. The valid choices

In [`app/utils/constants.ts`](../../app/utils/constants.ts) (lines 38-59):

```ts
export const COLOR_PALETTE = [
  { name: 'sky', bgClass: 'bg-sky-500' }, { name: 'blue', bgClass: 'bg-blue-500' },
  // … violet, pink, rose, orange, emerald, teal
] as const

export const COLOR_SECONDARY_MAP: Record<string, string> = {
  sky: 'blue', blue: 'indigo', violet: 'purple', /* … */
}
```

Each primary colour has a matching secondary, defined by `COLOR_SECONDARY_MAP`.

### 2. The `useColorPreference` composable

[`app/composables/useColorPreference.ts`](../../app/composables/useColorPreference.ts) applies and saves the choice:

```ts
export function useColorPreference() {
  const appConfig = useAppConfig()
  const colorCookie = useCookie('ui-primary-color', { maxAge: 2147483647 })  // ~68 years
  const currentPrimary = computed(() => appConfig.ui.colors.primary as string)

  function setColor(name: string) {
    appConfig.ui.colors.primary = name
    appConfig.ui.colors.secondary = COLOR_SECONDARY_MAP[name] ?? 'blue'
    colorCookie.value = name   // persists
  }
  return { palette: COLOR_PALETTE, secondaryMap: COLOR_SECONDARY_MAP, currentPrimary, setColor }
}
```

Mutating `appConfig.ui.colors.primary` updates the theme tokens *at runtime*: all UI that uses the primary colour changes instantly, with no rebuild.

### 3. Re-applying the colour at startup

A cookie alone isn't enough: when the app loads, the cookie must be re-read and re-applied. The [`app/plugins/color-preference.client.ts`](../../app/plugins/color-preference.client.ts) plugin does this:

```ts
export default defineNuxtPlugin(() => {
  const appConfig = useAppConfig()
  const saved = useCookie('ui-primary-color').value
  if (saved && COLOR_PALETTE.some(c => c.name === saved)) {  // validate against the palette
    appConfig.ui.colors.primary = saved
    appConfig.ui.colors.secondary = COLOR_SECONDARY_MAP[saved] ?? 'blue'
  }
})
```

The `COLOR_PALETTE.some(...)` guard ignores invalid cookie values (tampered or stale).

## Light/dark mode

Handled by Nuxt's color-mode module, configured with `colorMode: { preference: 'system' }` ([`nuxt.config.ts`](../../nuxt.config.ts) lines 56-58): by default it follows the operating-system preference. The settings page exposes the three states `light` / `system` / `dark` via `useColorMode()`:

```ts
const colorMode = useColorMode()
// in the buttons: colorMode.preference = 'light' | 'system' | 'dark'
```

## The settings page

[`app/pages/admin/settings.vue`](../../app/pages/admin/settings.vue) brings the three controls together: colour dots for the primary colour (`setColor`), three buttons for light/dark mode, and language buttons (`setLocale`). It's the single place where an admin customises the app's look and language.
