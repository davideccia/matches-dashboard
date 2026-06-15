# 09 — Dependencies

> See also: [03 — Build, Run, Test](03-build-run-test.md), [11 — Glossary](11-glossary.md).

The dependency list is intentionally small: a framework, a component library, two cross-cutting libraries (i18n, validation), and a transport library (STOMP). Everything else is a dev tool.

## Runtime dependencies

| Package                    | Version   | Role                                                                                                 |
|----------------------------|-----------|------------------------------------------------------------------------------------------------------|
| `nuxt`                     | `^4.4.6`  | The framework: file-based routing, auto-imports, build pipeline, plugin system.                       |
| `vue`                      | `^3.5.34` | The reactive UI library Nuxt is built on. Composition API used throughout.                            |
| `vue-router`               | `^5.0.7`  | Router used by Nuxt (transitive but pinned).                                                          |
| `@nuxt/ui`                 | `^4.8.0`  | 125+ accessible Vue components (`UButton`, `UTable`, `USlideover`, `UForm`, …) with theme tokens.    |
| `reka-ui`                  | `^2.9.9`  | Headless, accessible primitives that `@nuxt/ui` builds on top of (≈ Radix UI for Vue). Rarely used directly. |
| `tailwindcss`              | `^4.3.0`  | Utility-first CSS. v4 uses a CSS-first config (`@theme` in `main.css` instead of a JS config file).   |
| `@nuxtjs/i18n`             | `^10.4.0` | Locale routing, `useI18n()`, `useLocalePath()`. Configured in `nuxt.config.ts` with `it` + `en`.      |
| `zod`                      | `^4.4.3`  | Schema validation for forms. Schemas double as TypeScript types via `z.infer<typeof s>`.              |
| `moment`                   | `^2.30.1` | Date formatting utility. Used only in `app/utils/date.ts` for converting between ISO strings, HTML `datetime-local` values, and locale-aware display strings. |
| `@internationalized/date`  | `^3.12.2` | Strongly-typed calendar date value objects (e.g. `CalendarDate`). Required by `@nuxt/ui`'s date-picker components. |
| `@stomp/stompjs`           | `^7.3.0`  | STOMP-over-WebSocket client. Used only on the public scoreboard. See [06](06-external-integrations.md).|

## Dev dependencies

| Package                          | Role                                                                          |
|----------------------------------|-------------------------------------------------------------------------------|
| `typescript` `^6.0.3`            | Type checker. Run via `pnpm nuxi typecheck`.                                  |
| `eslint` + `@antfu/eslint-config`| Lint rules (single quotes, no semis, sorted imports). Run `pnpm eslint . --fix`. |
| `@nuxt/eslint`                   | Nuxt-aware ESLint integration; exposes auto-import globals to ESLint.         |
| `@intlify/eslint-plugin-vue-i18n`| Catches unused / missing i18n keys across `it.json` and `en.json`.            |
| `eslint-plugin-format`           | Format-style rules outside Prettier.                                          |
| `eslint-plugin-vuetify`          | Legacy plugin from a prior Vuetify era — present but inert against `@nuxt/ui`.|
| `@iconify-json/heroicons`        | Heroicons icon set (referenced as `i-heroicons-*`).                           |
| `@iconify-json/mdi`              | Material Design Icons set (referenced as `i-mdi-*`). Most icons in this app use the `mdi` prefix. |

## Things you might expect but won't find

- **No state management library.** No Pinia, no Vuex, no Redux. Shared state is `useState`-keyed refs. See [05](05-data-flow.md).
- **No HTTP client.** `$fetch` (built into Nuxt) wrapped by `useApi()` is the only one.
- **No test framework.** No Vitest, no Playwright, no Cypress. Manual verification only.
- **No CSS-in-JS / styled-components.** Tailwind utilities everywhere; `@nuxt/ui` components handle their own theming via tokens.
- **No analytics, no error tracking SDK.** Anything added later goes in a plugin file.
