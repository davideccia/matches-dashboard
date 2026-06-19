# 05 — Autenticazione

> Vedi anche: [06 — Flusso dati e livello API](06-data-flow-api.md), [03 — Struttura del progetto](03-project-structure.md)

L'autenticazione è interamente delegata all'API Laravel tramite **Laravel Sanctum** in modalità *token*. Il frontend non verifica password né emette token: invia le credenziali, riceve un token, lo conserva in un cookie e lo allega alle richieste successive. Tutto questo è orchestrato dal modulo `nuxt-auth-sanctum`.

## Concetti

- **Sanctum** → il sistema di autenticazione di Laravel. In *token mode* (≈ un braccialetto da concerto: lo mostri all'ingresso di ogni area riservata) il client riceve un token al login e lo invia come header `Authorization: Bearer …` su ogni richiesta protetta.
- **Middleware globale** → uno strato che intercetta *tutte* le rotte e blocca quelle che richiedono autenticazione, reindirizzando al login chi non è autenticato.

## Configurazione

Tutto parte da [`nuxt.config.ts`](../../nuxt.config.ts) (righe 70-86):

```ts
sanctum: {
  baseUrl: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:8081',
  mode: 'token',
  endpoints: {
    login: '/api/admin/auth/login',
    user: '/api/admin/auth/user',
    logout: '/api/admin/auth/logout',
  },
  redirect: { onLogout: '/login' },
  redirectIfUnauthenticated: true,
  globalMiddleware: {
    enabled: true,           // ← ogni rotta è protetta per default
    allow404WithoutAuth: true,
  },
}
```

Il punto cruciale: `globalMiddleware.enabled: true` significa che **per default ogni pagina richiede l'autenticazione**. Le pagine pubbliche devono esplicitamente *rinunciare* alla protezione.

## Pagine pubbliche: opt-out

Una pagina pubblica si dichiara tale con `definePageMeta`. Esempi reali:

```ts
// app/pages/public/tournaments/match_records.vue, riga 164
definePageMeta({ layout: false, sanctum: { excluded: true } })
```

```ts
// app/pages/login.vue, righe 108-111
definePageMeta({
  layout: false,
  sanctum: { guestOnly: true },   // solo per non autenticati
})
```

| Meta | Effetto |
|------|---------|
| `sanctum: { excluded: true }` | La rotta è esclusa dal controllo di autenticazione (pagine `/public/**`). |
| `sanctum: { guestOnly: true }` | La rotta è accessibile **solo** a chi non è autenticato (es. `/login`): un utente già loggato viene rimandato altrove. |
| (niente meta) | Rotta protetta: senza token si finisce a `/login`. |

## Il flusso di login

In [`app/pages/login.vue`](../../app/pages/login.vue) (righe 143-155):

```ts
async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    clear()                                  // pulisce eventuale stato precedente
    await useAuth().login({ email, password })
    await navigateTo('/admin')
  } catch {
    errorMsg.value = t('login.error')
  } finally {
    loading.value = false
  }
}
```

Il form è validato con Zod (`z.email()`, `z.string().min(1)`) prima ancora di chiamare l'API.

## Il composable `useAuth`

[`app/composables/useAuth.ts`](../../app/composables/useAuth.ts) è un sottile wrapper sopra `useSanctumAuth()` del modulo:

```ts
export function useAuth() {
  const { user: sanctumUser, isAuthenticated, login, logout, refreshIdentity } = useSanctumAuth<{ data: User }>()
  const user = computed(() => sanctumUser.value?.data ?? null)  // "spacchetta" { data: … }
  return { user, isAuthenticated, login, logout: () => logout(), fetchUser: refreshIdentity }
}
```

L'unica vera logica aggiunta è lo *unwrap* di `{ data: User }`: l'endpoint utente di Laravel avvolge la risorsa in `data`, e qui la si appiattisce a `user`.

## Logout e pulizia dello stato

Il plugin [`app/plugins/auth.ts`](../../app/plugins/auth.ts) si aggancia all'evento di logout di Sanctum:

```ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('sanctum:logout', () => {
    useUser().clear()
  })
})
```

`useUser().clear()` ([`useUser.ts`](../../app/composables/useUser.ts)) chiama `refreshNuxtData()`, che invalida le cache di `useAsyncData`/`useLazyAsyncData` in modo che nessun dato del vecchio utente sopravviva alla sessione.

## Redirect della root

[`app/pages/index.vue`](../../app/pages/index.vue) è essenzialmente un redirect:

```ts
const localePath = useLocalePath()
await navigateTo(localePath('/admin'), { replace: true })
```

Va sempre verso `/admin`; è poi il middleware globale di Sanctum a deviare verso `/login` se non c'è un token valido. `localePath()` mantiene il prefisso lingua corretto (es. `/en/admin`).

## Download autenticati

C'è un caso che bypassa il client Sanctum: il download di file binari (PDF). Vedi `download()` nel [Capitolo 06](06-data-flow-api.md): legge manualmente il token dal cookie `sanctum.token.cookie` e lo allega come header `Authorization`.
