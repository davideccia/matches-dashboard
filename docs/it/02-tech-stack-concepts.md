# 02 — Stack tecnologico e concetti

Questo capitolo spiega le tecnologie su cui è costruito il progetto, pensato per uno sviluppatore che non le ha mai usate. Le versioni sono lette da [`package.json`](../../package.json).

## I concetti fondamentali

### Vue 3 — il framework a componenti

**Vue** (`vue@^3.5`) è un framework JavaScript per costruire interfacce utente con i **componenti** (≈ elementi HTML personalizzati e riutilizzabili che racchiudono insieme markup, stile e comportamento). Un componente Vue vive in un file `.vue` con tre sezioni:

```vue
<template> <!-- il markup simile a HTML --> </template>
<script setup lang="ts"> /* la logica in TypeScript */ </script>
<style> /* CSS opzionale, con ambito locale */ </style>
```

Due idee di Vue che incontrerai di continuo:

- **Reattività** — `ref(0)` e `reactive({...})` creano valori che, quando cambiano, ri-renderizzano automaticamente la parte di UI che li usa. `ref` avvolge un singolo valore (lo leggi/scrivi tramite `.value` nello script); `reactive` avvolge un oggetto. Un `computed(() => …)` è un valore derivato da altri che si ricalcola su richiesta.
- **`<script setup>`** — una scorciatoia in fase di compilazione in cui tutto ciò che dichiari nel blocco script è automaticamente disponibile nel template. Nessun "export" esplicito da collegare.

`v-model` è il **binding bidirezionale** (≈ tieni sincronizzati questa casella di input e questa variabile, in entrambe le direzioni). `v-for`, `v-if` sono direttive di ciclo e condizione nel template.

### Nuxt 4 — il framework applicativo sopra Vue

**Nuxt** (`nuxt@^4.4`) è un framework costruito su Vue che aggiunge struttura e convenzioni così scrivi meno codice di collegamento. I suoi superpoteri qui:

- **Routing basato sui file** — un file in `app/pages/admin/settings.vue` diventa automaticamente l'URL `/admin/settings`. Nessuna configurazione di routing da mantenere. (Dettagli nel [Capitolo 03](03-project-structure.md).)
- **Auto-import** — le funzioni di Vue (`ref`, `computed`, `watch`), i tuoi composable (`useApi`, `useAuth`) e i componenti sono disponibili *senza* istruzioni `import`. Se vedi `useApi()` usato senza import in cima al file, è per questo.
- **Composable** — una convenzione Nuxt/Vue: una funzione chiamata `useQualcosa()` che impacchetta logica riutilizzabile con stato (≈ un mini-servizio che richiami da un componente). Questo codice ne ha diversi; vedi il [Capitolo 07](07-data-flow-api.md).
- **Moduli** — plugin che estendono Nuxt. Configurati in [`nuxt.config.ts`](../../nuxt.config.ts): `@nuxt/ui`, `@nuxtjs/i18n`, `@nuxt/eslint`, `nuxt-auth-sanctum`.

### Modalità SPA (`ssr: false`) — che tipo di app Nuxt è questa

Nuxt può renderizzare le pagine su un server (SSR) o costruire un'app puramente lato browser. Questo progetto imposta `ssr: false` in [`nuxt.config.ts`](../../nuxt.config.ts), rendendolo una **SPA** — *Single-Page Application* (≈ un unico guscio HTML che il browser riempie con JavaScript; la navigazione avviene lato client senza ricaricare l'intera pagina).

Due conseguenze importanti derivano direttamente da `ssr: false`:

1. **Nessun server Node.js a runtime.** `pnpm build` produce *file statici* (HTML/JS/CSS) che qualsiasi web server semplice (qui nginx) può servire. In produzione non gira alcun codice lato server proveniente da questo repo.
2. **Le variabili d'ambiente sono incorporate in fase di build.** Poiché nulla di questo repo gira su un server per leggere le variabili a runtime, valori come l'URL dell'API vengono *compilati nel bundle JavaScript* al momento della build. Cambiare l'URL del backend richiede una nuova build. Se ne parla nel [Capitolo 04](04-build-run-configure.md) ed è una comune fonte di confusione.

## Le librerie chiave

| Libreria | Versione | Ruolo | Spiegazione |
|----------|----------|-------|-------------|
| `@nuxt/ui` | `^4.8` | La libreria di componenti | Un set pronto di oltre 125 componenti UI stilizzati e accessibili (`UButton`, `UTable`, `UForm`, `USlideover`…). Tutto ciò che inizia con `U` in un template viene da qui. |
| `tailwindcss` | `^4.3` | Stile | **CSS utility-first** (≈ minuscole classi monouso come `flex gap-4 rounded-xl` composte direttamente nel markup, invece di scrivere fogli di stile separati). |
| `nuxt-auth-sanctum` | `^3.1` | Autenticazione | Collega l'app a **Laravel Sanctum** (≈ il sistema di login a token di Laravel). Fornisce `useSanctumClient()` e `useSanctumAuth()`. Vedi il [Capitolo 05](05-authentication.md). |
| `laravel-echo` + `pusher-js` | `^2.3` / `^8.5` | Tempo reale | **Echo** è un client per sottoscriversi agli eventi inviati dal server; **pusher-js** è il protocollo WebSocket sottostante che usa. Si connette a **Laravel Reverb**. Vedi il [Capitolo 08](08-realtime-scoreboard.md). |
| `@nuxtjs/i18n` | `^10.4` | Internazionalizzazione | Traduzioni e URL con prefisso di lingua (italiano di default, `/en/` per l'inglese). Vedi il [Capitolo 10](10-i18n-theming.md). |
| `zod` | `^4.4` | Validazione | **Validazione di schema** (≈ dichiari la forma e le regole che un dato deve rispettare; lo rifiuti se non le rispetta). Usata per ogni form. Vedi il [Capitolo 07](07-data-flow-api.md). |
| `moment` | `^2.30` | Date | Formattazione/parsing delle date, incapsulato in [`app/utils/date.ts`](../../app/utils/date.ts). |
| `vue-router` | `^5.0` | Routing | Il router sottostante che Nuxt pilota tramite il routing basato sui file. Raramente lo tocchi direttamente. |
| `@internationalized/date`, `reka-ui` | — | Transitive | Trascinate da `@nuxt/ui` per la gestione delle date e le primitive di componenti headless. |

## Strumenti

- **pnpm** — il gestore di pacchetti (≈ npm, ma più veloce ed efficiente su disco grazie a uno store condiviso). I comandi sono `pnpm <script>`.
- **TypeScript** (`typescript@^6`) — JavaScript con tipi statici. Tutta l'app è tipizzata; i tipi di dominio sono in [`app/types/models.ts`](../../app/types/models.ts).
- **ESLint** con `@antfu/eslint-config` — il linter e garante dello stile. Stile della casa: **virgolette singole, niente punto e virgola, import ordinati**. Esegui `pnpm eslint . --fix` dopo le modifiche (vedi [`CLAUDE.md`](../../CLAUDE.md)).
- **Vite** — lo strumento di build e il bundler del server di sviluppo che Nuxt usa sotto il cofano.

Con il vocabolario a posto, il prossimo capitolo percorre il vero layout delle cartelle.
