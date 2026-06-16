# 11 — Glossario

Tutti i termini specifici di linguaggio e framework spiegati in questa documentazione, in ordine alfabetico. I termini di dominio (torneo, incontro, ecc.) sono definiti nel [Capitolo 09](09-domain-model.md).

- **Auto-import (Nuxt)** — Nuxt rende automaticamente disponibili le funzioni di Vue, i tuoi composable e i tuoi componenti senza scrivere istruzioni `import`. Spiega perché `useApi()` o `<DataTable />` compaiono senza una riga di import.

- **Bearer token** — una credenziale di autenticazione inviata nell'header HTTP `Authorization: Bearer <token>`. Il client Sanctum lo allega automaticamente; l'helper `download` lo fa manualmente.

- **Build-time vs runtime** — la configurazione *build-time* è fissata quando compili l'app (`nuxt.config.ts`, variabili d'ambiente incorporate nel bundle). Quella *runtime* può cambiare mentre l'app gira (`app.config.ts`, il colore del tema).

- **Componente (Vue)** — un pezzo di UI riutilizzabile e autonomo definito in un file `.vue` (template + script + stile opzionale). Il mattone dell'interfaccia.

- **Composable** — una convenzione Vue/Nuxt: una funzione riutilizzabile chiamata `useQualcosa()` che impacchetta logica con stato così che più componenti possano condividerla (≈ un mini-servizio). Esempio: `useApi`, `useAuth`.

- **`computed`** — un valore reattivo derivato da altri valori reattivi; si ricalcola automaticamente quando i suoi input cambiano.

- **CRUD** — Create, Read, Update, Delete: le quattro operazioni di base su un record. Le pagine admin sono schermate CRUD. Vedi il [Capitolo 06](06-admin-crud-pattern.md).

- **Debounce** — attendere che l'attività si fermi prima di agire (es. aspettare 300 ms dopo che l'utente smette di digitare prima di inviare una ricerca), per evitare una raffica di chiamate.

- **`defineExpose`** — un'API Vue che permette a un componente di pubblicare metodi/valori al genitore tramite un `ref` nel template. `DataTable` espone così `refresh()`.

- **`definePageMeta`** — API Nuxt per allegare metadati a una pagina (il suo layout, le regole di autenticazione). Es. `{ layout: false, sanctum: { excluded: true } }`.

- **Eager-load (`with=`)** — chiedere al backend di includere i record correlati in una risposta (es. un incontro con i suoi atleti angolo rosso/blu), tramite un parametro di query `with=relazione1,relazione2`. Altrimenti quei campi relazione sono assenti.

- **Echo (Laravel Echo)** — la libreria client lato browser per sottoscriversi agli eventi inviati dal server in tempo reale via WebSocket. Vedi il [Capitolo 08](08-realtime-scoreboard.md).

- **Enum** — un insieme fisso di valori stringa ammessi (es. gli stati degli incontri). Dichiarati come array `as const` in `constants.ts` così che TypeScript ne derivi un tipo unione.

- **Routing basato sui file** — Nuxt trasforma l'albero dei file `app/pages/` direttamente in URL; `pages/admin/settings.vue` diventa `/admin/settings`. Nessuna tabella di rotte manuale.

- **i18n** — *internazionalizzazione*: supportare più lingue. Gestita da `@nuxtjs/i18n`. Vedi il [Capitolo 10](10-i18n-theming.md).

- **IntersectionObserver** — un'API del browser che invoca una callback quando un elemento entra nella vista. `ApiSelectMenu` la usa per implementare lo scroll infinito.

- **Locale (lingua)** — un'impostazione di lingua/regione (`it`, `en`). Determina le traduzioni e il prefisso URL.

- **Middleware (di rotta)** — codice che gira prima che una rotta si carichi, per consentirla/reindirizzarla. Il *middleware globale* di Sanctum protegge ogni rotta a meno che una pagina non si tiri fuori.

- **Modulo (Nuxt)** — un pacchetto che estende le capacità di Nuxt, registrato in `nuxt.config.ts` (`@nuxt/ui`, `@nuxtjs/i18n`, `nuxt-auth-sanctum`, `@nuxt/eslint`).

- **Notifica-poi-rilettura** — il pattern realtime qui: il messaggio WebSocket è un segnale minimo "qualcosa è cambiato"; il client poi ri-recupera i dati autorevoli via HTTP. Vedi il [Capitolo 08](08-realtime-scoreboard.md).

- **Pinia / store** — *non usato qui*; lo stato è tenuto nei composable e nella cache dati di Nuxt. Elencato solo per notarne l'assenza.

- **Plugin (Nuxt)** — codice che gira una volta all'avvio dell'app per inizializzare le cose (es. creare la connessione Echo). File in `app/plugins/`; `.client.ts` = solo browser.

- **pnpm** — il gestore di pacchetti usato (un'alternativa a npm più veloce ed efficiente su disco). Comandi: `pnpm <script>`.

- **`provide` / `$echo`** — un plugin può `provide` un valore che diventa disponibile in tutta l'app sull'istanza Nuxt (qui `$echo`, il client Echo).

- **Protocollo Pusher / pusher-js** — il protocollo di messaggistica WebSocket che Laravel Reverb parla e che Echo usa sotto il cofano tramite la libreria `pusher-js`.

- **`reactive` / `ref`** — le primitive di reattività di Vue. `ref(x)` avvolge un singolo valore (accesso via `.value` nello script); `reactive({...})` avvolge un oggetto. Modificarli ri-renderizza la UI.

- **Reverb (Laravel Reverb)** — il server WebSocket lato Laravel che spinge gli eventi in tempo reale al browser. Vedi il [Capitolo 08](08-realtime-scoreboard.md).

- **Sanctum (Laravel Sanctum)** — il sistema di autenticazione a token di Laravel. Il modulo `nuxt-auth-sanctum` lo integra. Vedi il [Capitolo 05](05-authentication.md).

- **Schema (Zod)** — una descrizione dichiarata della forma di un dato e delle sue regole. Zod valida i dati dei form rispetto ad esso prima dell'invio.

- **`<script setup>`** — la sintassi concisa di Vue per i componenti single-file dove le dichiarazioni di primo livello sono auto-esposte al template.

- **Slide-over (`USlideover`)** — un pannello `@nuxt/ui` che scivola dal bordo dello schermo; usato per i form di creazione/modifica.

- **Slot** — un segnaposto nel template di un componente che il genitore riempie con markup personalizzato. `DataTable` usa slot con nome come `#actions-cell` per renderizzare le colonne in modo personalizzato.

- **SPA (Single-Page Application)** — un'app web che carica un unico guscio HTML e renderizza/naviga tutto lato client con JavaScript. Questo progetto è una SPA (`ssr: false`).

- **SSR (Server-Side Rendering)** — renderizzare le pagine su un server prima di inviare l'HTML. Qui esplicitamente *disabilitato* (`ssr: false`), rendendo l'app una SPA statica.

- **Tailwind CSS** — un framework CSS utility-first: stilizzi gli elementi con molte piccole classi (`flex gap-4 rounded-xl`) direttamente nel markup.

- **Toast** — una piccola notifica transitoria a comparsa. Usata per il feedback di successo/errore dopo le chiamate API (`useToast()`).

- **`useAsyncData` / `useLazyAsyncData`** — helper di Nuxt che eseguono un fetcher asincrono e restituiscono `data` / `status` / `refresh` reattivi. La variante "lazy" non blocca la navigazione durante il caricamento.

- **`useCookie`** — un composable di Nuxt per leggere/scrivere un cookie in modo reattivo. Usato per il colore del tema e il token Sanctum.

- **`v-model`** — il binding bidirezionale di Vue tra un input (o un componente figlio) e una variabile.

- **WebSocket** — una connessione bidirezionale persistente tra browser e server che permette al server di spingere messaggi senza essere interrogato. La base del tabellone live.

- **Zod** — una libreria TypeScript di validazione di schema usata per validare i dati di ogni form. Vedi il [Capitolo 07](07-data-flow-api.md).
