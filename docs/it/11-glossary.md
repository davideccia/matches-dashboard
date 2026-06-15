# 11 — Glossario

> Vedi anche: tutti i capitoli.

Termini specifici di Vue, Nuxt, TypeScript e delle librerie usate in questo codice, spiegati per uno sviluppatore che non li ha mai incontrati.

## Vue

| Termine | Significato in parole semplici |
|---------|--------------------------------|
| **SFC** (Single-File Component) | Un file `.vue` con tre sezioni: `<template>` (markup), `<script setup>` (logica), `<style>` (CSS). Un componente per file. |
| **Composition API** | Lo stile Vue moderno in cui la logica vive dentro un blocco `<script setup>` usando funzioni come `ref`, `computed`, `watch`. Sostituisce la vecchia Options API. |
| **`ref<T>()`** | Un contenitore reattivo a singola cella. `count.value` legge/scrive; nel template viene auto-unwrappato in `count`. ≈ un observable a singola cella (BehaviorSubject). |
| **`computed()`** | Un valore reattivo derivato. Si ricalcola quando cambiano le dipendenze. ≈ `useMemo` di React in automatico. |
| **`watch()`** | Esegue una callback quando uno o più valori reattivi cambiano. |
| **`onMounted` / `onBeforeUnmount`** | Hook di ciclo di vita. ≈ `useEffect(..., [])` di React e la sua funzione di cleanup. |
| **Composable** | Una funzione (chiamata `use…`) che raggruppa stato reattivo e comportamento per il riuso. ≈ hook React. |
| **`defineProps` / `defineEmits` / `defineExpose`** | Macro compile-time dentro `<script setup>` che dichiarano input, eventi e metodi accessibili dall'esterno di un componente. |
| **Slot** | Un buco con nome nel template di un componente figlio che il genitore riempie. `<template #header>` si infila nello slot `header`. ≈ `children` di React più i children con nome. |
| **`v-model`** | Binding a due vie. `<UInput v-model="x" />` ↔ `<UInput :model-value="x" @update:model-value="x = $event" />`. |
| **Direttiva** | `v-if`, `v-for`, `v-on` (`@click`), `v-bind` (`:prop`). Istruzioni di template compile-time. |

## Nuxt

| Termine | Significato in parole semplici |
|---------|--------------------------------|
| **`pages/`** | Auto-routato. Ogni `.vue` diventa un URL. `[id].vue` è un segmento dinamico. |
| **`layouts/`** | Wrapper attorno alle pagine. `default.vue` si applica se la pagina non specifica `definePageMeta({ layout: false })`. |
| **`middleware/`** | Funzioni eseguite prima della navigazione. Il suffisso `.global.ts` le fa girare per ogni rotta. |
| **`plugins/`** | Vengono eseguiti una volta all'avvio dell'app. Suffisso `.client.ts` → solo browser; `.server.ts` → solo server. |
| **Auto-import** | I file in `components/`, `composables/`, `utils/` sono globalmente disponibili — nessun `import` necessario. |
| **`definePageMeta`** | Macro compile-time che attacca metadati (layout, middleware) a una rotta. Non viene eseguita a runtime. |
| **`useState<T>(key, factory)`** | Ref condivisa SSR-safe chiavata per stringa. In una SPA, di fatto un singleton di ref. |
| **`useAsyncData` / `useLazyAsyncData`** | Composable che avvolgono un fetcher e restituiscono `{ data, status, refresh, error }`. La variante `Lazy` non blocca la navigazione. |
| **`$fetch`** | Il client HTTP built-in di Nuxt (basato su `ofetch`). Lancia eccezione sulle risposte non-2xx. |
| **`useRuntimeConfig()`** | Accede ai valori dichiarati in `nuxt.config.ts` sotto `runtimeConfig`. I valori `public.*` sono esposti al bundle del browser. |
| **`useAppConfig()`** | Accede all'oggetto reattivo esportato da `app.config.ts`. Diverso dalla runtime config — pensato per i token UI. |
| **`navigateTo()`** | Navigazione programmatica. Restituisce un redirect da middleware/pages. |
| **`ssr: false`** | Disabilita il server-side rendering. L'output è una SPA statica. |
| **HMR** (Hot Module Replacement) | Vite sostituisce a caldo i moduli modificati in un'app in esecuzione senza un reload completo. |

## TypeScript

| Termine | Significato in parole semplici |
|---------|--------------------------------|
| **`as const`** | Restringe i tipi letterali e rende array/oggetti profondamente readonly. `['A','B'] as const` ha tipo `readonly ['A', 'B']`, non `string[]`. |
| **`typeof X[number]`** | Data una tupla `X`, è l'unione dei tipi dei suoi elementi. Combinato con `as const`, dà un enum di literal string. |
| **`z.infer<typeof schema>`** | Estrae il tipo TypeScript da uno schema Zod così che lo stato del form e il validatore restino allineati. |
| **Componente generico** | `<DataTable>` dichiara `generic="T extends Record<string, unknown>"` in `<script setup>`, così le `columns` e il tipo della riga sono collegati. |

## i18n

| Termine | Significato in parole semplici |
|---------|--------------------------------|
| **Locale** | Un tag di lingua (`it`, `en`). |
| **`useI18n()`** | Restituisce `{ t, locale, ... }` per il componente corrente. `t('key')` cerca la traduzione. |
| **`useLocalePath()`** | Restituisce una funzione che trasforma un path semplice (`/admin`) nel path locale-aware (`/admin` in italiano, `/en/admin` in inglese). |
| **`prefix_except_default`** | Strategia di routing — la locale di default ha URL puliti; le altre locale sono prefissate (`/en/...`). |

## @nuxt/ui (libreria di componenti)

| Termine | Significato in parole semplici |
|---------|--------------------------------|
| **`UApp`** | Provider radice. Ospita toast, modali, tooltip. |
| **`UDashboardSidebar` / `UDashboardPanel` / `UDashboardGroup`** | Primitive di layout per gli shell admin. |
| **`USlideover`** | Un drawer laterale destro. Qui è la casa di ogni form panel. |
| **`UForm` + `:schema`** | Un form che esegue uno schema Zod al submit e mostra gli errori sui campi. |
| **`UTable`** | Un componente di tabella dati semi-headless. Avvolto da `DataTable` per aggiungere paginazione e stato vuoto. |
| **Token di tema** | `primary`, `secondary`, `neutral` ecc. sono configurati in `app.config.ts` e applicati come classi utility Tailwind del tipo `bg-primary` e `text-muted`. |

## STOMP / WebSocket

| Termine | Significato in parole semplici |
|---------|--------------------------------|
| **WebSocket** | Una connessione TCP bidirezionale e persistente ottenuta tramite upgrade HTTP. |
| **STOMP** | Simple Text-Oriented Messaging Protocol — un piccolo framing pub/sub di messaggi sovrapposto al WebSocket. Il backend espone destinazioni come `/topic/...`; i client fanno `subscribe`. |
| **`Client` (da `@stomp/stompjs`)** | L'oggetto client STOMP. `.activate()` si connette, `.deactivate()` si disconnette, `onConnect` è il posto in cui sottoscriversi. |
| **Topic** | Una destinazione di broadcast. Qualsiasi sottoscrittore a `/topic/tournaments/{id}/matches` riceve ogni messaggio pubblicato lì. |
