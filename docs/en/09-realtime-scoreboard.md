# 09 — Realtime scoreboard

> See also: [08 — Match board & auto-scroll](08-match-board-and-scroll.md), [04 — Build, run & configure](04-build-run-configure.md)

The public scoreboard ([`app/pages/public/tournaments/match_records.vue`](../../app/pages/public/tournaments/match_records.vue)) updates itself when the backend changes a match, without the user reloading the page. It does this with **Laravel Echo + Reverb** and a precise pattern: *notify-then-refetch*.

## Concepts

- **WebSocket** → a persistent, two-way communication channel between browser and server (≈ an always-open phone line, instead of many separate calls like HTTP). It lets the server "push" messages to the client.
- **Laravel Echo** → a client library that simplifies subscribing to *channels* and listening for *events* over WebSocket.
- **Reverb** → Laravel's WebSocket server, compatible with the Pusher protocol (that's why `pusher-js` is also used).
- **Channel** → a "topic" you subscribe to (here: `tournaments.{id}.match_records`).
- **Event** → a message published on a channel (here: `.MatchRecordChanged`).

## Notify-then-refetch: the pattern, and the why

When a match changes, the server does **not** send the new data over WebSocket. It sends only a small signal: "something changed, re-read." The client then makes a normal REST `GET` to obtain the updated list.

Why not send the data directly in the WebSocket message? Because this way **REST stays the single source of truth**. The WebSocket payload can't drift out of sync with the REST response, it doesn't duplicate the backend's serialisation logic, and it handles the hard cases for free (relations loaded with `with=`, permissions, formatting). The WebSocket is just a doorbell.

```
Backend changes a match
   │  broadcast .MatchRecordChanged { refresh: true }
   ▼
Client (Echo) receives the event → lastEvent.value = payload
   ▼
watch(lastEvent): if event.refresh → refreshMatchRecords()
   ▼
GET /api/public/tournaments/{id}/match_records  (REST, source of truth)
   ▼
The grid re-renders + auto-scroll to the active match (Chapter 08)
```

## The three pieces of code

### 1. The Echo plugin

[`app/plugins/echo.client.ts`](../../app/plugins/echo.client.ts) creates the Echo instance at startup (browser only, hence the `.client` suffix) and makes it available as `$echo`:

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

All connection parameters come from the `NUXT_PUBLIC_REVERB_*` variables ([Chapter 04](04-build-run-configure.md)). `forceTLS` becomes `true` only if the scheme is `https`.

The [`useEcho()`](../../app/composables/useEcho.ts) composable is a one-line accessor: `return useNuxtApp().$echo`.

### 2. The subscription composable

[`app/composables/useTournamentMatchRecords.ts`](../../app/composables/useTournamentMatchRecords.ts) encapsulates the entire subscription lifecycle:

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
    unsubscribe()            // always leave the previous channel
    if (id) { subscribe(id) }
  }, { immediate: true })

  onUnmounted(unsubscribe)   // cleanup when the component goes away

  return { lastEvent }
}
```

Important aspects:

- **Takes a `Ref`**, not a value: so it reacts to tournament changes. The `watch` with `{ immediate: true }` runs on the first render too.
- **Always unsubscribe before subscribe**: switching tournament leaves the old channel so orphaned listeners don't accumulate (memory leak / double updates).
- **`onUnmounted(unsubscribe)`**: when the page is unmounted, the socket is released.
- **`channel.listen('.MatchRecordChanged', …)`** — the leading dot in `.MatchRecordChanged` is Echo's convention for an explicit "broadcast as" event name on the Laravel side (no class namespace).
- The typed payload is minimal: `interface MatchRecordChangedPayload { refresh: boolean }`. It confirms the pattern: no domain data travels in the message, only a flag.

### 3. Usage in the page

In [`public/tournaments/match_records.vue`](../../app/pages/public/tournaments/match_records.vue) (lines 255-261):

```ts
const tournamentId = computed(() => selectedTournament.value?.id ?? null)
const { lastEvent } = useTournamentMatchRecords(tournamentId)

watch(lastEvent, (event) => {
  if (event?.refresh) { refreshMatchRecords() }   // re-read via REST
})
```

`refreshMatchRecords` is the `refresh` returned by the `useLazyAsyncData` that loads the matches (lines 227-236). When it re-reads, the grid re-renders and the auto-scroll to the active match described in [Chapter 08](08-match-board-and-scroll.md) fires.

## Full lifecycle

```
Public page mounted
   selectedTournament = null  → tournamentId = null → no subscription
User picks a tournament
   tournamentId changes → watch → subscribe('tournaments.{id}.match_records')
   useLazyAsyncData loads the initial list (REST)
… during the event …
   backend broadcasts .MatchRecordChanged { refresh: true }
   → lastEvent updated → watch → refreshMatchRecords() (REST) → grid + seek
User goes back (clearTournament) or leaves the page
   tournamentId = null / onUnmounted → unsubscribe → socket released
```
