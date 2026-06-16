# 08 — Il tabellone in tempo reale

Il tabellone pubblico in `/public/tournaments/match_records` si aggiorna dal vivo: mentre un admin assegna i punteggi di un incontro nel back office, gli spettatori che guardano dal telefono vedono il cambiamento in pochi istanti — senza ricaricare. Questo capitolo spiega come, da capo a fondo.

## La tecnologia: Laravel Echo + Reverb

Il livello realtime è un **WebSocket** (≈ un tubo bidirezionale persistente tra browser e server, così il server può *spingere* messaggi senza che il browser li richieda). Nello specifico:

- **Laravel Reverb** — il server WebSocket lato server (parte del backend Laravel). Parla il protocollo Pusher.
- **Laravel Echo** (`laravel-echo`) — il client lato browser che si sottoscrive ai canali e ascolta eventi con nome.
- **pusher-js** — la libreria di basso livello del protocollo che Echo pilota.

## Connessione: il plugin Echo

[`app/plugins/echo.client.ts`](../../app/plugins/echo.client.ts) gira una volta all'avvio e crea l'istanza Echo dalla configurazione `NUXT_PUBLIC_REVERB_*` (vedi il [Capitolo 04](04-build-run-configure.md)):

```ts
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
```

`provide: { echo }` rende l'istanza disponibile in tutta l'app come `$echo`. Il minuscolo composable [`useEcho()`](../../app/composables/useEcho.ts) la restituisce e basta:

```ts
export function useEcho() { return useNuxtApp().$echo }
```

## Sottoscrizione: `useTournamentMatchRecords`

[`app/composables/useTournamentMatchRecords.ts`](../../app/composables/useTournamentMatchRecords.ts) incapsula il ciclo di vita del canale. Gli passi un id torneo *reattivo*; gestisce sottoscrizione/disiscrizione automaticamente:

```ts
export function useTournamentMatchRecords(tournamentId: Ref<string | null>) {
  const echo = useEcho()
  const lastEvent = ref<MatchRecordChangedPayload | null>(null)
  let channel = null

  function subscribe(id) {
    channel = echo.channel(`tournaments.${id}.match_records`)   // canale pubblico
    channel.listen('.MatchRecordChanged', (payload) => { lastEvent.value = payload })
  }
  function unsubscribe() { /* stopListening + leaveChannel + azzera */ }

  watch(tournamentId, (id) => { unsubscribe(); if (id) subscribe(id) }, { immediate: true })
  onUnmounted(unsubscribe)

  return { lastEvent }
}
```

Dettagli da notare:

- Il nome del canale è `tournaments.{id}.match_records` — un **canale pubblico** (nessun handshake di autenticazione), ed è per questo che il tabellone funziona per gli spettatori non loggati.
- Il nome dell'evento è `.MatchRecordChanged`. Il punto iniziale dice a Echo che è il nome esatto del broadcast (salta il prefisso di namespace predefinito di Laravel).
- Il composable si pulisce da sé: al cambio dell'id torneo si disiscrive dal vecchio canale prima di sottoscrivere il nuovo, e si disiscrive allo smontaggio del componente. Nessun socket lasciato aperto.
- Ciò che espone è solo `lastEvent` — un ref reattivo che contiene l'ultimo payload ricevuto.

## Il pattern: notifica-poi-rilettura

Ecco la decisione di progetto chiave. Il messaggio WebSocket **non** porta i nuovi dati dell'incontro. Il suo payload è minimo:

```ts
interface MatchRecordChangedPayload { refresh: boolean }
```

È un *campanello, non una consegna*. Quando arriva, la pagina ri-recupera l'intero elenco incontri via semplice HTTP. Dalla pagina ([`app/pages/public/tournaments/match_records.vue`](../../app/pages/public/tournaments/match_records.vue)):

```ts
const tournamentId = computed(() => selectedTournament.value?.id ?? null)
const { lastEvent } = useTournamentMatchRecords(tournamentId)

watch(lastEvent, (event) => {
  if (event?.refresh) { refreshMatchRecords() }   // ri-GET dell'intero elenco
})
```

Perché farlo così?

- **L'HTTP resta l'unica fonte di verità.** L'elenco arriva sempre da un unico endpoint REST ben collaudato, completamente formato (con le relazioni caricate in anticipo). Il socket non deve mai trasportare — né rischiare di divergere da — i dati canonici.
- **Semplicità e correttezza.** Niente riconciliazione di aggiornamenti parziali del socket con lo stato locale; ricarichi e basta. Il compromesso (un giro HTTP extra per ogni cambiamento) è trascurabile alla scala di un tabellone.

## I due stati della pagina

La pagina del tabellone è un unico componente con due stati visivi:

- **Stato A — selettore del torneo.** Nessun torneo ancora scelto. Elenca i tornei pubblici da `/api/public/tournaments` (paginati, ricercabili, con debounce) come schede cliccabili.
- **Stato B — la griglia degli incontri.** Una volta selezionato un torneo, mostra un'intestazione live (con un badge "LIVE" pulsante) e una griglia responsiva di schede `MatchRecordCardReadOnly`. Recupera `/api/public/tournaments/{id}/match_records?with=tournament,red_corner,blue_corner,winner,weight_category,discipline`.

Poiché sono pagine pubbliche, aggirano il `useApi()` autenticato e chiamano il backend direttamente con `$fetch` verso `/api/public/...` (nessun token inviato) — vedi il [Capitolo 05](05-authentication.md).

## Un tocco gradevole: scroll automatico all'incontro live

A ogni cambio di dati — incluse le riletture innescate dal socket — la pagina porta in vista l'incontro attualmente attivo, così lo schermo dello spettatore è sempre centrato su ciò che sta accadendo ora:

```ts
watch(matchesData, async () => {
  await nextTick()
  const inProgressIdx = matches.value.findIndex(m => m.status === 'in_progress')
  if (inProgressIdx !== -1) matchCardEls.value[inProgressIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  else { /* ripiega sul primo incontro 'scheduled' */ }
})
```

## Sequenza da capo a fondo

```
L'admin assegna i punteggi di un incontro (back office)
        │  Laravel salva + trasmette su  tournaments.{id}.match_records
        ▼
Reverb spinge  .MatchRecordChanged { refresh: true }
        ▼
Browser: useTournamentMatchRecords imposta lastEvent
        ▼
watch della pagina(lastEvent) → refreshMatchRecords()
        ▼
GET /api/public/tournaments/{id}/match_records?with=…   (HTTP = fonte di verità)
        ▼
la griglia si ri-renderizza + scrolla automaticamente all'incontro in corso
```

> [!NOTE]
> Il `README.md` alla radice descrive il tempo reale come "STOMP su WebSocket verso `/topic/...`". È obsoleto. Il codice usa **Laravel Echo + Reverb** sul canale `tournaments.{id}.match_records`, come documentato qui.
