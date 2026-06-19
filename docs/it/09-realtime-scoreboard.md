# 09 — Tabellone in tempo reale

> Vedi anche: [08 — Tabellone incontri e auto-scroll](08-match-board-and-scroll.md), [04 — Build, avvio e configurazione](04-build-run-configure.md)

Il tabellone pubblico ([`app/pages/public/tournaments/match_records.vue`](../../app/pages/public/tournaments/match_records.vue)) si aggiorna da solo quando il backend cambia un incontro, senza che l'utente ricarichi la pagina. Lo fa con **Laravel Echo + Reverb** e un pattern preciso: *notifica-poi-rilettura*.

## Concetti

- **WebSocket** → un canale di comunicazione bidirezionale e persistente tra browser e server (≈ una linea telefonica sempre aperta, invece di tante telefonate separate come con HTTP). Permette al server di "spingere" messaggi verso il client.
- **Laravel Echo** → libreria client che semplifica l'abbonarsi a *canali* e l'ascoltare *eventi* via WebSocket.
- **Reverb** → il server WebSocket di Laravel, compatibile con il protocollo Pusher (per questo si usa anche `pusher-js`).
- **Canale** → un "argomento" a cui ci si abbona (qui: `tournaments.{id}.match_records`).
- **Evento** → un messaggio pubblicato su un canale (qui: `.MatchRecordChanged`).

## Notifica-poi-rilettura: il pattern, e il perché

Quando un incontro cambia, il server **non** invia i dati nuovi via WebSocket. Invia solo un piccolo segnale "qualcosa è cambiato, rileggi". Il client allora fa una normale `GET` REST per ottenere la lista aggiornata.

Perché non spedire direttamente i dati nel messaggio WebSocket? Perché così **REST resta l'unica fonte di verità**. Il payload WebSocket non può andare "fuori sincrono" rispetto alla risposta REST, non duplica la logica di serializzazione del backend, e gestisce gratis i casi complessi (relazioni caricate con `with=`, permessi, formattazione). Il WebSocket fa solo da campanello.

```
Backend cambia un incontro
   │  broadcast .MatchRecordChanged { refresh: true }
   ▼
Client (Echo) riceve l'evento → lastEvent.value = payload
   ▼
watch(lastEvent): se event.refresh → refreshMatchRecords()
   ▼
GET /api/public/tournaments/{id}/match_records  (REST, fonte di verità)
   ▼
La griglia si ridisegna + auto-scroll all'incontro attivo (Capitolo 08)
```

## I tre pezzi di codice

### 1. Il plugin Echo

[`app/plugins/echo.client.ts`](../../app/plugins/echo.client.ts) crea l'istanza Echo all'avvio (solo nel browser, da cui il suffisso `.client`) e la rende disponibile come `$echo`:

```ts
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  window.Pusher = Pusher
  const echo = new Echo({
    broadcaster: 'reverb',
    key: config.public.reverbAppKey,
    wsHost: config.public.reverbHost,
    wsPort: Number(config.public.reverbPort),
    wssPort: Number(config.public.reverbPort),
    forceTLS: config.public.reverbScheme === 'https',
    enabledTransports: ['ws', 'wss'],
  })
  return { provide: { echo } }
})
```

Tutti i parametri di connessione vengono dalle variabili `NUXT_PUBLIC_REVERB_*` ([Capitolo 04](04-build-run-configure.md)). `forceTLS` diventa `true` solo se lo schema è `https`.

Il composable [`useEcho()`](../../app/composables/useEcho.ts) è un accessor di una riga: `return useNuxtApp().$echo`.

### 2. Il composable di sottoscrizione

[`app/composables/useTournamentMatchRecords.ts`](../../app/composables/useTournamentMatchRecords.ts) incapsula tutto il ciclo di vita della sottoscrizione:

```ts
export function useTournamentMatchRecords(tournamentId: Ref<string | null>) {
  const echo = useEcho()
  const lastEvent = ref<MatchRecordChangedPayload | null>(null)
  let channel = null

  function subscribe(id: string) {
    channel = echo.channel(`tournaments.${id}.match_records`)
    channel.listen('.MatchRecordChanged', (payload) => { lastEvent.value = payload })
  }
  function unsubscribe() {
    if (channel) {
      channel.stopListening('.MatchRecordChanged')
      echo.leaveChannel(channel.name)
      channel = null
    }
  }

  watch(tournamentId, (id) => {
    unsubscribe()            // lascia sempre il canale precedente
    if (id) { subscribe(id) }
  }, { immediate: true })

  onUnmounted(unsubscribe)   // pulizia quando il componente sparisce

  return { lastEvent }
}
```

Aspetti importanti:

- **Riceve un `Ref`**, non un valore: così reagisce ai cambi di torneo. Il `watch` con `{ immediate: true }` parte anche al primo render.
- **Sempre unsubscribe prima di subscribe**: cambiando torneo si abbandona il canale vecchio per non accumulare ascoltatori orfani (memory leak / doppi aggiornamenti).
- **`onUnmounted(unsubscribe)`**: quando la pagina viene smontata, il socket viene rilasciato.
- **`channel.listen('.MatchRecordChanged', …)`** — il punto iniziale in `.MatchRecordChanged` è la convenzione di Echo per indicare un nome di evento "broadcast as" esplicito lato Laravel (senza namespace di classe).
- Il payload tipizzato è minimale: `interface MatchRecordChangedPayload { refresh: boolean }`. Conferma il pattern: nel messaggio non viaggiano dati di dominio, solo un flag.

### 3. L'uso nella pagina

In [`public/tournaments/match_records.vue`](../../app/pages/public/tournaments/match_records.vue) (righe 255-261):

```ts
const tournamentId = computed(() => selectedTournament.value?.id ?? null)
const { lastEvent } = useTournamentMatchRecords(tournamentId)

watch(lastEvent, (event) => {
  if (event?.refresh) { refreshMatchRecords() }   // rilegge via REST
})
```

`refreshMatchRecords` è la `refresh` restituita dalla `useLazyAsyncData` che carica gli incontri (righe 227-236). Quando rilegge, la griglia si ridisegna e scatta l'auto-scroll all'incontro attivo descritto nel [Capitolo 08](08-match-board-and-scroll.md).

## Ciclo di vita completo

```
Pagina pubblica montata
   selectedTournament = null  → tournamentId = null → nessuna sottoscrizione
Utente sceglie un torneo
   tournamentId cambia → watch → subscribe('tournaments.{id}.match_records')
   useLazyAsyncData carica la lista iniziale (REST)
… durante l'evento …
   backend broadcast .MatchRecordChanged { refresh: true }
   → lastEvent aggiornato → watch → refreshMatchRecords() (REST) → griglia + seek
Utente torna indietro (clearTournament) o lascia la pagina
   tournamentId = null / onUnmounted → unsubscribe → socket rilasciato
```
