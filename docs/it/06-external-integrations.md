# 06 — Integrazioni Esterne

> Vedi anche: [05 — Flusso dei Dati](05-data-flow.md), [07 — Modelli di Dominio](07-domain-models.md).

L'app dialoga con esattamente un sistema esterno — l'API Spring Boot — su due canali: HTTP (tutto il CRUD) e STOMP-su-WebSocket (notifiche push per lo scoreboard). Entrambi condividono lo stesso base URL (`NUXT_PUBLIC_API_BASE`).

## HTTP: `useApi()`

`app/composables/useApi.ts` restituisce un piccolo wrapper attorno a `$fetch.create()` (`$fetch` è il client HTTP built-in di Nuxt, ≈ `axios` ma più leggero). Il wrapper fa tre cose: imposta il base URL dalla runtime config, aggancia il bearer JWT dalla cella condivisa `useState('auth-token')` e invia la locale attiva come header `Accept-Language` in modo che il backend possa restituire messaggi di errore localizzati.

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
  const download = async (path: string, filename = 'document.pdf') => { /* blob + click su anchor */ }

  return { get, post, put, del, download }
}
```

Ogni pagina admin passa da questo helper. Non esiste un altro client HTTP.

L'utility `getApiErrorMessage(e)` (sempre in `useApi.ts`) estrae la stringa `message` dal body dell'errore del backend (`e.data.message`) quando `$fetch` lancia un'eccezione — utile nei blocchi `catch` che vogliono mostrare un messaggio di errore fornito dal backend in un toast.

### Envelope di risposta del backend

Gli endpoint paginati di Spring Boot restituiscono `{ data: { content: T[], totalElements: number, ... } }`. Il componente `DataTable` legge esattamente quei due campi. Gli endpoint di dettaglio restituiscono `{ data: T }`. L'envelope è abbastanza coerente da permettere alle pagine di tipare direttamente come `<{ data: T }>`.

### Errori

`$fetch` lancia un'eccezione per le risposte non-2xx. I chiamanti gestiscono con `try { ... } catch { useToast().add({ ... }) }` oppure lasciano che l'handler di submit del form mostri gli errori di validazione. Non c'è un interceptor globale che mostra toast a ogni fallimento — i fallimenti sono gestiti per call site.

## Auth: flusso di login JWT

Il login sono due chiamate REST:

```ts
// app/composables/useAuth.ts
const login = async (email: string, password: string) => {
  const { get, post } = useApi()
  const data = await post<{ token: string }>('/api/desktop/auth/login', { email, password })
  setToken(data.token)
  setUser(await get<AuthUser>('/api/desktop/auth/user'))
}
```

`setToken` scrive il token in `useState` *e* in `localStorage`. Il plugin `app/plugins/auth.client.ts` rivalida il token salvato ad ogni caricamento di pagina chiamando `GET /api/desktop/auth/user`; in caso di fallimento ripulisce tutto e lascia che `auth.global.ts` reindirizzi a `/login`.

## STOMP / WebSocket: scoreboard live

Lo scoreboard pubblico su `/public/tournaments/matches` apre una connessione STOMP-su-WebSocket per mantenere allineata la griglia dei match con il backend.

```ts
// app/pages/public/tournaments/matches.vue, righe ~164, 273-289
import { Client } from '@stomp/stompjs'

const wsBase = apiBase.replace(/^http/, 'ws')  // http://… → ws://…  (e https → wss)

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

La callback della subscription **ignora il body del messaggio** e chiama `fetchMatches(id)` — una banale GET REST. Il WebSocket viene usato esclusivamente come segnale "qualcosa è cambiato, fai un refetch ora". Compromessi:

- **Pro:** REST resta l'unica fonte di verità; non serve fondere aggiornamenti parziali nello stato reattivo; nessun bug da cache stantia.
- **Pro:** La logica di reconnect è banale — un messaggio perso significa solo un refetch perso, e il messaggio successivo recupera.
- **Contro:** Ogni notifica costa un round-trip HTTP. Va bene per uno scoreboard di torneo (bassa frequenza, payload piccolo); meno ideale per stream ad alta frequenza.

### Ciclo di vita

- `startClient(id)` parte quando un torneo viene selezionato.
- `stopClient()` parte quando l'utente deseleziona il torneo o il componente viene smontato (in `onBeforeUnmount`). La pagina chiude il socket anche al cambio di torneo, prima di aprirne uno nuovo.

## Perché due canali, non uno solo

Il backend pubblica solo eventi "match modificati" per il torneo attivo. Tutto il resto (atleti, iscrizioni, configurazioni) è richiesta/risposta su REST. Separare i trasporti mantiene ogni layer semplice: STOMP parla solo di match live, e REST gestisce tutto il resto con auth bearer token.
