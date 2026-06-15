# 06 — External Integrations

> See also: [05 — Data Flow](05-data-flow.md), [07 — Domain Models](07-domain-models.md).

The app talks to exactly one external system — the Spring Boot API — over two channels: HTTP (all CRUD) and STOMP-over-WebSocket (scoreboard push notifications). Both share the same base URL (`NUXT_PUBLIC_API_BASE`).

## HTTP: `useApi()`

`app/composables/useApi.ts` returns a small wrapper around `$fetch.create()` (`$fetch` is Nuxt's built-in HTTP client, ≈ `axios` but lighter). The wrapper does three things: sets the base URL from runtime config, attaches the JWT bearer token from the shared `useState('auth-token')` cell, and forwards the active locale as an `Accept-Language` header so the backend can return localized error messages.

```ts
// app/composables/useApi.ts
export function useApi() {
  const token = useState<string | null>('auth-token')
  const { public: { apiBase } } = useRuntimeConfig()
  const { $i18n } = useNuxtApp()

  const client = $fetch.create({
    baseURL: apiBase as string,
    onRequest({ options }) {
      const headers = new Headers(options.headers as HeadersInit)
      if (token.value) {
        headers.set('Authorization', `Bearer ${token.value}`)
      }
      headers.set('Accept-Language', $i18n.locale.value)
      options.headers = headers
    },
  })

  const get      = <T>(path: string, params?: QueryParams) => client<T>(path, { method: 'GET', params })
  const post     = <T>(path: string, body?: Record<string, unknown>, params?: QueryParams) => client<T>(path, { method: 'POST', body, params })
  const put      = <T>(path: string, body?: Record<string, unknown>, params?: QueryParams) => client<T>(path, { method: 'PUT', body, params })
  const del      = <T>(path: string, params?: QueryParams) => client<T>(path, { method: 'DELETE', params })
  const download = async (path: string, filename = 'document.pdf') => { /* blob + anchor click */ }

  return { get, post, put, del, download }
}
```

Every admin page goes through this helper. There is no other HTTP client.

A companion utility `getApiErrorMessage(e)` (also in `useApi.ts`) extracts the `message` string from the backend error body (`e.data.message`) when `$fetch` throws — useful in `catch` blocks that want to surface a backend-provided error string in a toast.

### Backend response envelope

Spring Boot's paginated endpoints return `{ data: { content: T[], totalElements: number, ... } }`. The `DataTable` component reads exactly those two fields. Detail endpoints return `{ data: T }`. The wrapping is consistent enough that pages can be typed against `<{ data: T }>` directly.

### Errors

`$fetch` throws on non-2xx. Callers either `try { ... } catch { useToast().add({ ... }) }` or let the form's submit handler surface validation errors. There is no global interceptor that surfaces toasts on every failure — failures are handled per call site.

## Auth: JWT login flow

Login is two REST calls:

```ts
// app/composables/useAuth.ts
const login = async (email: string, password: string) => {
  const { get, post } = useApi()
  const data = await post<{ token: string }>('/api/desktop/auth/login', { email, password })
  setToken(data.token)
  setUser(await get<AuthUser>('/api/desktop/auth/user'))
}
```

`setToken` writes the token to `useState` *and* to `localStorage`. The plugin `app/plugins/auth.client.ts` re-validates the stored token on every page load by calling `GET /api/desktop/auth/user`; on failure it clears everything and lets `auth.global.ts` redirect to `/login`.

## STOMP / WebSocket: live scoreboard

The public scoreboard at `/public/tournaments/matches` opens a STOMP-over-WebSocket connection to keep the matches grid in sync with the backend.

```ts
// app/pages/public/tournaments/matches.vue, around lines 164, 273-289
import { Client } from '@stomp/stompjs'

const wsBase = apiBase.replace(/^http/, 'ws')  // http://… → ws://…  (and https → wss)

let stompClient: Client | null = null

function startClient(id: string) {
  stompClient = new Client({
    brokerURL: `${wsBase}/ws`,
    onConnect: () => {
      stompClient!.subscribe(`/topic/tournaments/${id}/matches`, () => fetchMatches(id))
    },
  })
  stompClient.activate()
}

function stopClient() {
  stompClient?.deactivate()
  stompClient = null
}
```

### Notify-then-refetch

The subscription callback **ignores the message body** and calls `fetchMatches(id)` — a plain REST GET. The WebSocket is used purely as a "something changed, refetch now" signal. Trade-offs:

- **Pro:** REST stays the single source of truth; no need to merge partial updates into reactive state; no stale-cache bugs.
- **Pro:** Reconnect logic is trivial — a missed message just means a missed refetch, and the next message will catch up.
- **Con:** Each notification costs one HTTP round-trip. Fine for a tournament scoreboard (low-frequency, small payload); not ideal for high-frequency streams.

### Lifecycle

- `startClient(id)` runs when a tournament is selected.
- `stopClient()` runs when the user deselects the tournament or the component unmounts (in `onBeforeUnmount`). The page also tears the socket down on tournament change before opening a new one.

## Why these two channels, not one

The backend pushes only "matches changed" events for an active tournament. Everything else (athletes, registrations, configuration) is request/response over REST. Splitting the transports keeps each layer simple: STOMP only ever talks about live matches, and REST handles everything else with bearer-token auth.
