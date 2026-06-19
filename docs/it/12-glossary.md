# 12 — Glossario

> Vedi anche: tutti i capitoli.

Termini specifici del linguaggio, del framework o del dominio usati in questa documentazione, spiegati per chi non li ha mai incontrati. In ordine alfabetico.

| Termine | Significato in parole semplici |
|---------|--------------------------------|
| **Angolo rosso / blu** (`red_corner` / `blue_corner`) | I due contendenti di un incontro. Convenzione universale negli sport da ring per distinguere i due atleti. |
| **`as const`** | In TypeScript, marca un array/oggetto come immutabile e ne restringe il tipo ai valori letterali esatti. Usato per gli enum del dominio in `constants.ts`. |
| **Auto-import** | Funzione di Nuxt che rende disponibili componenti, composable e helper senza scriverne l'`import`. Per questo nel codice compaiono `useApi()` o `<DataTable>` "dal nulla". |
| **Build-time vs runtime** | *Build-time* = quando si compila l'app; *runtime* = quando gira nel browser. Con `ssr: false` le variabili `NUXT_PUBLIC_*` sono fissate a build-time. |
| **Canale** (channel) | Un "argomento" WebSocket a cui ci si abbona per ricevere eventi. Qui: `tournaments.{id}.match_records`. |
| **Composable** | Funzione `useXxx()` che incapsula logica riutilizzabile con stato reattivo. Analogo a un hook di React. |
| **`computed`** | Valore derivato in Vue che si ricalcola automaticamente quando cambiano le sue dipendenze. |
| **CRUD** | Create, Read, Update, Delete: le quattro operazioni di base su una risorsa. Il pattern del Capitolo 07. |
| **Debounce** | Tecnica che ritarda l'esecuzione di un'azione finché non c'è una pausa (qui 300 ms): evita di interrogare l'API a ogni tasto premuto durante la ricerca. |
| **`defineModel` / `defineProps` / `defineEmits`** | Macro di Vue per dichiarare, rispettivamente, un `v-model`, le proprietà in ingresso e gli eventi in uscita di un componente. |
| **Eager loading** (`with=`) | Chiedere al backend di includere le relazioni di un record nella stessa risposta, evitando richieste successive. |
| **Echo** (Laravel Echo) | Libreria client per abbonarsi a canali e ascoltare eventi WebSocket. |
| **Enum** | Insieme chiuso di valori ammessi (es. gli stati di un incontro). Qui realizzati con array `as const`. |
| **Evento** (broadcast) | Messaggio pubblicato su un canale WebSocket. Qui: `.MatchRecordChanged`. |
| **`findIndex`** | Metodo degli array JS: restituisce l'indice del primo elemento che soddisfa una condizione, o `-1` se nessuno. Usato per trovare l'incontro in corso. |
| **Function ref** (`:ref="(el) => …"`) | Modo Vue per ottenere il nodo DOM reale di un elemento, anche dentro un `v-for`. Usato dall'auto-scroll per mappare indice → elemento. |
| **Idratazione** (hydration) | Processo con cui il JS "rianima" l'HTML rendendolo interattivo. `<ClientOnly>` evita problemi di idratazione per i componenti che esistono solo nel browser. |
| **i18n** | Internazionalizzazione: gestione di più lingue. |
| **IntersectionObserver** | API del browser che notifica quando un elemento entra/esce dalla viewport. Usato per lo scroll infinito di `ApiSelectMenu`. |
| **Middleware** | Strato che intercetta le richieste/navigazioni. Il middleware globale di Sanctum protegge tutte le rotte per default. |
| **`nextTick`** | In Vue, attende che il DOM sia stato aggiornato dopo un cambio di stato. Cruciale per l'auto-scroll: senza, gli elementi delle card non esisterebbero ancora. |
| **Notifica-poi-rilettura** | Pattern del tabellone live: il WebSocket invia solo "rileggi", poi il client rilegge via REST. Mantiene REST come unica fonte di verità. |
| **Nuxt** | Meta-framework su Vue: routing basato sui file, auto-import, composable, plugin. |
| **Paginazione Laravel** | Forma standard delle liste dall'API: `{ data: T[], meta: { total, current_page, last_page, per_page } }`. |
| **Plugin** | Codice eseguito all'avvio dell'app per configurare qualcosa (Echo, auth, colore del tema). |
| **Popover** | Pannello fluttuante ancorato a un elemento (qui: il menu di `ApiSelectMenu`). |
| **`ref`** | Scatola reattiva di Vue: cambiando il suo `.value` la UI che lo usa si ridisegna. |
| **Reverb** | Server WebSocket di Laravel, compatibile col protocollo Pusher. |
| **Routing basato sui file** | Convenzione Nuxt: la struttura di `app/pages/` definisce gli URL. |
| **Sanctum** | Sistema di autenticazione di Laravel. Qui in *token mode*: il client riceve un token e lo allega alle richieste. |
| **`scrollIntoView`** | Metodo DOM che scorre la pagina fino a portare un elemento in vista. Con `block: 'center'` lo centra verticalmente. |
| **Seek (auto-scroll)** | Scroll automatico del tabellone all'incontro in corso (o, in mancanza, al prossimo programmato). Vedi Capitolo 08. |
| **Slideover** | Pannello che scorre da un lato dello schermo (componente `USlideover`). Usato dai `*FormPanel`. |
| **SPA** | Single-Page Application: una sola pagina HTML, contenuto riscritto via JS durante la navigazione. |
| **`ssr: false`** | Disattiva il rendering lato server: Nuxt produce un sito statico, senza server Node a runtime. |
| **Thin client** | Client "magro": disegna l'interfaccia ma non conserva dati né regole, che vivono nel backend. |
| **Token** | Credenziale rilasciata al login e allegata alle richieste come `Authorization: Bearer …`. |
| **Tailwind CSS** | Framework CSS utility-first: lo stile si scrive con classi (`flex`, `gap-2`) direttamente nell'HTML. |
| **`v-model`** | Binding bidirezionale di Vue: collega un input a una variabile in entrambe le direzioni. |
| **`watch`** | Esegue una funzione quando una sorgente reattiva cambia. Motore di ricerca con debounce, auto-scroll e sottoscrizioni WebSocket. |
| **WebSocket** | Canale bidirezionale persistente browser↔server, che permette al server di "spingere" messaggi al client. |
| **Zod** | Libreria di validazione a schemi: definisci la forma attesa dei dati e Zod valida l'input. |
