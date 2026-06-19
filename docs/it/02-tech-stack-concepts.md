# 02 — Stack tecnologico e concetti

> Vedi anche: [03 — Struttura del progetto](03-project-structure.md), [06 — Flusso dati e livello API](06-data-flow-api.md), [12 — Glossario](12-glossary.md)

Questo capitolo presenta le tecnologie del progetto partendo da zero. Se conosci già Vue/Nuxt puoi saltare alla tabella finale; altrimenti leggi per intero, perché i concetti qui spiegati ricorrono in tutta la documentazione.

## I concetti di base

### SPA (Single-Page Application)

Una *SPA* (≈ un'applicazione che vive in una sola pagina HTML) carica il browser una volta sola e poi riscrive il contenuto della pagina con JavaScript man mano che l'utente naviga, senza ricaricare da capo. La navigazione tra `/admin/tournaments` e `/admin/settings` non richiede un nuovo round-trip al server: cambia solo ciò che JavaScript disegna.

### Vue 3

*Vue* è un framework per costruire interfacce a componenti. Un **componente** (≈ un mattoncino di UI riutilizzabile, con il suo HTML, la sua logica e il suo stile) è un file `.vue` diviso in tre parti:

```vue
<template> <!-- l'HTML --> </template>
<script setup lang="ts"> /* la logica, in TypeScript */ </script>
<style> /* stile opzionale */ </style>
```

Concetti Vue che incontrerai costantemente:

- `ref(x)` → una **scatola reattiva** (≈ una variabile osservabile): quando il suo `.value` cambia, la UI che lo usa si ridisegna. In `<template>` si scrive senza `.value`.
- `computed(() => …)` → un valore **derivato** che si ricalcola da solo quando cambiano le sue dipendenze.
- `watch(sorgente, callback)` → esegue una funzione **quando** una sorgente reattiva cambia. È il cuore di molti meccanismi qui (ricerca con debounce, auto-scroll, sottoscrizione WebSocket).
- `v-model` → *binding bidirezionale* (⇆): collega un input del form a una variabile, in entrambe le direzioni.
- `defineProps` / `defineEmits` → come un componente riceve dati dal genitore (props) e gli comunica eventi (emit).

### Nuxt 4

*Nuxt* è un meta-framework costruito sopra Vue. Aggiunge, tra le altre cose:

- **Routing basato sui file**: la struttura di cartelle dentro `app/pages/` diventa automaticamente la struttura degli URL (vedi [Capitolo 03](03-project-structure.md)).
- **Auto-import**: componenti, `composables` e helper non vanno importati a mano — Nuxt li rende disponibili globalmente. Per questo nel codice vedi `useApi()` o `<DataTable>` senza un `import` in cima.
- **Composables**: funzioni `useXxx()` che incapsulano logica riutilizzabile con stato reattivo (≈ hook di React). Le nostre vivono in [`app/composables/`](../../app/composables/).
- **Plugin**: codice che gira all'avvio dell'app per configurare qualcosa (qui: Echo, auth, preferenza colore). Vivono in [`app/plugins/`](../../app/plugins/).

In questo progetto Nuxt è configurato con `ssr: false` ([`nuxt.config.ts`](../../nuxt.config.ts) riga 5): niente rendering lato server, output statico. Le conseguenze sono nel [Capitolo 04](04-build-run-configure.md).

## Le librerie chiave

| Libreria | A cosa serve qui | Spiegazione |
|----------|------------------|-------------|
| **@nuxt/ui v4** | Tutti i componenti UI (`UButton`, `UTable`, `USlideover`, `UForm`…) | Una libreria di 125+ componenti Vue accessibili, costruiti su *Tailwind CSS*. I componenti del progetto iniziano con `U`. |
| **Tailwind CSS v4** | Stile | CSS *utility-first*: lo stile si scrive con classi come `flex`, `gap-2`, `text-muted` direttamente nell'HTML, invece che in fogli di stile separati. |
| **nuxt-auth-sanctum** | Login e protezione delle rotte | Integra l'autenticazione a token di *Laravel Sanctum*. Fornisce `useSanctumClient()` e `useSanctumAuth()`. Vedi [Capitolo 05](05-authentication.md). |
| **Zod v4** | Validazione dei form | Definisci uno *schema* dei dati attesi e Zod valida l'input, restituendo errori per campo. Vedi [Capitolo 06](06-data-flow-api.md). |
| **Laravel Echo + pusher-js** | Tempo reale | Client WebSocket che si abbona a "canali" e ascolta eventi. Qui parla con *Laravel Reverb*. Vedi [Capitolo 09](09-realtime-scoreboard.md). |
| **@nuxtjs/i18n** | Internazionalizzazione | Gestisce le due lingue (it/en) e il prefisso `/en/`. Vedi [Capitolo 11](11-i18n-theming.md). |
| **moment** | Date | Formatta date ISO per la visualizzazione localizzata. Vedi [`app/utils/date.ts`](../../app/utils/date.ts). |
| **pnpm** | Package manager | Alternativa a `npm`, più veloce e parsimoniosa con il disco. |
| **TypeScript** | Linguaggio | JavaScript con i tipi. I modelli di dominio sono tipizzati in [`app/types/models.ts`](../../app/types/models.ts). |

## Un esempio che mette tutto insieme

Questo frammento (semplificato dal pattern reale) mostra come i concetti collaborano:

```ts
// dentro <script setup> di una pagina admin
const api = useApi()                       // composable auto-importato
const search = ref('')                     // scatola reattiva
const { data } = useLazyAsyncData('x', () => // fetch dichiarativa di Nuxt
  api.get('/api/admin/athletes', { search: search.value }),
  { watch: [search] },                     // rilegge quando `search` cambia
)
const items = computed(() => data.value?.data ?? []) // valore derivato
```

Nessun `import`: `useApi`, `ref`, `computed`, `useLazyAsyncData` sono tutti auto-importati da Nuxt.
