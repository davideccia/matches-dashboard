# 05 — Autenticazione

L'autenticazione risponde a due domande: *chi è questo visitatore* e *gli è consentito stare qui*. In quest'app le risposte vivono nel backend Laravel; il compito del frontend è ottenere un token, allegarlo alle richieste e regolare le rotte.

## Il meccanismo: token Laravel Sanctum

L'app usa **Laravel Sanctum** (≈ il sistema di login a token integrato in Laravel) tramite il modulo `nuxt-auth-sanctum`. La configurazione è in [`nuxt.config.ts`](../../nuxt.config.ts):

```ts
sanctum: {
  baseUrl: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:8081',
  mode: 'token',                       // basato su token (non modalità cookie/SPA)
  endpoints: {
    login:  '/api/admin/auth/login',
    user:   '/api/admin/auth/user',
    logout: '/api/admin/auth/logout',
  },
  redirect: { onLogout: '/login' },
  redirectIfUnauthenticated: true,
  globalMiddleware: {
    enabled: true,                     // ogni rotta richiede autenticazione di default…
    allow404WithoutAuth: true,
  },
}
```

Punti chiave:

- **Modalità token** — al login riuscito il backend restituisce un token; il modulo lo memorizza (in un cookie chiamato `sanctum.token.cookie`) e lo allega automaticamente come header `Authorization: Bearer …` nelle richieste successive.
- **Il middleware globale è abilitato** — è il default importante. Ogni rotta è protetta *a meno che non si tiri esplicitamente fuori*. Quindi le nuove pagine sono private di default; le pagine pubbliche vanno marcate.

## Effettuare il login

La pagina di login è [`app/pages/login.vue`](../../app/pages/login.vue). Essa:

1. Dichiara `definePageMeta({ layout: false, sanctum: { guestOnly: true } })` — niente sidebar admin, e `guestOnly` significa che un utente *già* loggato che visita `/login` viene reindirizzato altrove.
2. Renderizza una `UAuthForm` (un componente `@nuxt/ui`) con uno schema **Zod** che valida email + password.
3. All'invio chiama `useAuth().login({ email, password })`, poi `navigateTo('/admin')`.
4. In caso di errore mostra un avviso localizzato.

Offre inoltre pulsanti che portano alle pagine pubbliche di iscrizione e tabellone, così i visitatori non autenticati hanno una via d'accesso.

## Il composable `useAuth`

[`app/composables/useAuth.ts`](../../app/composables/useAuth.ts) è un sottile wrapper su `useSanctumAuth<User>()` del modulo:

```ts
export function useAuth() {
  const { user, isAuthenticated, login, logout: sanctumLogout, refreshIdentity } = useSanctumAuth<User>()
  const logout = () => sanctumLogout()
  return { user, isAuthenticated, login, logout, fetchUser: refreshIdentity }
}
```

- `user` — un ref reattivo all'utente corrente (`User`, o null).
- `isAuthenticated` — booleano reattivo.
- `login(credentials)` — esegue la richiesta di login.
- `logout()` — cancella il token e (da configurazione) reindirizza a `/login`.
- `fetchUser()` — ri-recupera l'utente corrente dal backend.

La forma tipizzata `User` proviene da [`app/types/models.ts`](../../app/types/models.ts).

## Pulizia al logout

[`app/plugins/auth.ts`](../../app/plugins/auth.ts) aggancia l'evento `sanctum:logout` del modulo per ripulire i dati in cache locale:

```ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('sanctum:logout', () => {
    useUser().clear()
  })
})
```

[`useUser().clear()`](../../app/composables/useUser.ts) chiama `refreshNuxtData()`, che invalida i risultati `useAsyncData` in cache di Nuxt così che nessun dato obsoleto dell'utente precedente resti dopo il logout. L'azione di logout vera e propria è collegata al menu utente della sidebar in [`app/layouts/default.vue`](../../app/layouts/default.vue).

## Rotte pubbliche (non autenticate)

Poiché il middleware globale protegge tutto di default, le pagine pubbliche devono tirarsi fuori esplicitamente nel loro `definePageMeta`:

```ts
// app/pages/public/tournaments/match_records.vue
definePageMeta({ layout: false, sanctum: { excluded: true } })
```

`sanctum: { excluded: true }` esenta la pagina dall'obbligo di autenticazione. Queste pagine pubbliche inoltre **non** usano l'helper autenticato [`useApi()`](07-data-flow-api.md) — chiamano il backend direttamente con `$fetch` verso endpoint `/api/public/...`, quindi nessun token viene inviato. (Vedi la spiegazione del tabellone nel [Capitolo 08](08-realtime-scoreboard.md).)

## La catena di reindirizzamento in pratica

1. Visiti `/` → [`index.vue`](../../app/pages/index.vue) chiama subito `navigateTo('/admin')`.
2. `/admin` è protetto; se non c'è un token valido, il middleware globale di Sanctum (con `redirectIfUnauthenticated: true`) manda il browser a `/login`.
3. Dopo un login riuscito, l'utente viene mandato a `/admin` e ci resta finché il token non viene cancellato.

> [!NOTE]
> Il `README.md` alla radice dice che l'auth è "JWT memorizzato in localStorage". È obsoleto. Il codice usa **token Sanctum** gestiti da `nuxt-auth-sanctum` (memorizzati nel cookie `sanctum.token.cookie`), come mostrato sopra.
