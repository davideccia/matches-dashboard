# 08 — The Realtime Scoreboard

The public scoreboard at `/public/tournaments/match_records` updates itself live: as an admin scores a bout in the back office, spectators watching their phones see the change within moments — without refreshing. This chapter explains how, end to end.

## The technology: Laravel Echo + Reverb

The realtime layer is a **WebSocket** (≈ a persistent two-way pipe between browser and server, so the server can *push* messages without the browser asking). Specifically:

- **Laravel Reverb** — the server-side WebSocket server (part of the Laravel backend). It speaks the Pusher protocol.
- **Laravel Echo** (`laravel-echo`) — the browser-side client that subscribes to channels and listens for named events.
- **pusher-js** — the low-level protocol library Echo drives.

## Connecting: the Echo plugin

[`app/plugins/echo.client.ts`](../../app/plugins/echo.client.ts) runs once at startup and creates the Echo instance from the `NUXT_PUBLIC_REVERB_*` config (see [Chapter 04](04-build-run-configure.md)):

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

`provide: { echo }` makes the instance available app-wide as `$echo`. The tiny [`useEcho()`](../../app/composables/useEcho.ts) composable just returns it:

```ts
export function useEcho() { return useNuxtApp().$echo }
```

## Subscribing: `useTournamentMatchRecords`

[`app/composables/useTournamentMatchRecords.ts`](../../app/composables/useTournamentMatchRecords.ts) encapsulates the channel lifecycle. You hand it a *reactive* tournament id; it manages subscribe/unsubscribe automatically:

```ts
export function useTournamentMatchRecords(tournamentId: Ref<string | null>) {
  const echo = useEcho()
  const lastEvent = ref<MatchRecordChangedPayload | null>(null)
  let channel = null

  function subscribe(id) {
    channel = echo.channel(`tournaments.${id}.match_records`)   // public channel
    channel.listen('.MatchRecordChanged', (payload) => { lastEvent.value = payload })
  }
  function unsubscribe() { /* stopListening + leaveChannel + null out */ }

  watch(tournamentId, (id) => { unsubscribe(); if (id) subscribe(id) }, { immediate: true })
  onUnmounted(unsubscribe)

  return { lastEvent }
}
```

Notable details:

- The channel name is `tournaments.{id}.match_records` — a **public channel** (no auth handshake), which is why the scoreboard works for logged-out spectators.
- The event name is `.MatchRecordChanged`. The leading dot tells Echo this is the *exact* broadcast name (it skips Laravel's default namespace prefixing).
- The composable cleans up after itself: when the tournament id changes it unsubscribes from the old channel before subscribing to the new one, and it unsubscribes on component unmount. No leaked sockets.
- What it exposes is just `lastEvent` — a reactive ref holding the most recent payload.

## The pattern: notify-then-refetch

Here is the key design decision. The WebSocket message does **not** carry the new match data. Its payload is minimal:

```ts
interface MatchRecordChangedPayload { refresh: boolean }
```

It is a *doorbell, not a delivery*. When it arrives, the page re-fetches the full match list over plain HTTP. From the page ([`app/pages/public/tournaments/match_records.vue`](../../app/pages/public/tournaments/match_records.vue)):

```ts
const tournamentId = computed(() => selectedTournament.value?.id ?? null)
const { lastEvent } = useTournamentMatchRecords(tournamentId)

watch(lastEvent, (event) => {
  if (event?.refresh) { refreshMatchRecords() }   // re-GET the full list
})
```

Why do it this way?

- **HTTP stays the single source of truth.** The list always comes from one well-tested REST endpoint, fully shaped (with relations eager-loaded). The socket never has to carry — or risk drifting from — the canonical data.
- **Simplicity & correctness.** No reconciling partial socket updates against local state; you just reload. The trade-off (an extra HTTP round-trip per change) is negligible at scoreboard scale.

## The page's two states

The scoreboard page is a single component with two visual states:

- **State A — tournament selector.** No tournament chosen yet. It lists public tournaments from `/api/public/tournaments` (paged, searchable, debounced) as clickable cards.
- **State B — the match grid.** Once a tournament is selected, it shows a live header (with a pulsing "LIVE" badge) and a responsive grid of `MatchRecordCardReadOnly` cards. It fetches `/api/public/tournaments/{id}/match_records?with=tournament,red_corner,blue_corner,winner,weight_category,discipline`.

Because these are public pages, they bypass the authenticated `useApi()` and call the backend directly with `$fetch` against `/api/public/...` (no token sent) — see [Chapter 05](05-authentication.md).

## A nice touch: auto-scroll to the live bout

On every data change — including socket-triggered refetches — the page scrolls the currently-active match into view, so a spectator's screen always centres on what's happening now:

```ts
watch(matchesData, async () => {
  await nextTick()
  const inProgressIdx = matches.value.findIndex(m => m.status === 'in_progress')
  if (inProgressIdx !== -1) matchCardEls.value[inProgressIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  else { /* fall back to the first 'scheduled' match */ }
})
```

## End-to-end sequence

```
Admin scores a bout (back office)
        │  Laravel persists + broadcasts on  tournaments.{id}.match_records
        ▼
Reverb pushes  .MatchRecordChanged { refresh: true }
        ▼
Browser: useTournamentMatchRecords sets lastEvent
        ▼
page watch(lastEvent) → refreshMatchRecords()
        ▼
GET /api/public/tournaments/{id}/match_records?with=…   (HTTP = source of truth)
        ▼
grid re-renders + auto-scrolls to the in-progress match
```

> [!NOTE]
> The root `README.md` describes realtime as "STOMP over WebSocket to `/topic/...`". That is stale. The code uses **Laravel Echo + Reverb** on the channel `tournaments.{id}.match_records`, as documented here.
