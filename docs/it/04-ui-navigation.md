# 04 — UI e Navigazione

> Vedi anche: [02 — Struttura dei Moduli](02-module-structure.md), [10 — Pattern Ricorrenti](10-notable-patterns.md).

La navigazione in Nuxt è **basata sui file**: ogni `.vue` sotto `app/pages/` diventa un URL. Un *layout* avvolge un gruppo di pagine con elementi condivisi (sidebar, header). Un *route middleware* è una funzione che Nuxt esegue prima di ogni navigazione, qui usata per proteggere l'area admin.

## Come vengono derivate le rotte

| File                                                | URL (italiano, default)            | URL (inglese)                                |
|-----------------------------------------------------|------------------------------------|----------------------------------------------|
| `pages/index.vue`                                   | `/`                                | `/en/`                                       |
| `pages/login.vue`                                   | `/login`                           | `/en/login`                                  |
| `pages/admin/index.vue`                             | `/admin`                           | `/en/admin`                                  |
| `pages/admin/tournaments/index.vue`                 | `/admin/tournaments`               | `/en/admin/tournaments`                      |
| `pages/admin/tournaments/matches/board.vue`         | `/admin/tournaments/matches/board` | `/en/admin/tournaments/matches/board`        |
| `pages/public/tournaments/matches.vue`              | `/public/tournaments/matches`      | `/en/public/tournaments/matches`             |

Il modulo i18n è in modalità `prefix_except_default` (`nuxt.config.ts`), quindi gli URL italiani non hanno prefisso e quelli inglesi sono prefissati con `/en/`. Per costruire un URL localizzato in codice, si usa la composable `useLocalePath()`:

```ts
// app/layouts/default.vue, intorno alla riga 50
const localePath = useLocalePath()
// localePath('/admin') → '/admin' in italiano, '/en/admin' in inglese
```

## Redirect dalla root

`pages/index.vue` è una sola riga: reindirizza ogni visita a `/admin`. Il middleware `auth.global.ts` rimanda poi gli utenti non autenticati a `/login`.

```vue
<!-- app/pages/index.vue -->
<script setup lang="ts">
const localePath = useLocalePath()
await navigateTo(localePath('/admin'), { replace: true })
</script>
```

## Layout

Esiste un solo layout, `app/layouts/default.vue`. Renderizza lo shell della sidebar admin usando `<UDashboardSidebar>` di `@nuxt/ui`. Costruisce il menu di navigazione a partire dalle stringhe i18n e collega l'email dell'utente e l'azione `logout()`.

Le pagine che non devono essere avvolte (login, le due pagine pubbliche) fanno opt-out:

```vue
<script setup lang="ts">
definePageMeta({ layout: false })
</script>
```

`definePageMeta` è una macro compile-time di Nuxt: la build estrae la chiamata e aggiunge i metadati al record di rotta, quindi a runtime non viene effettivamente eseguita.

## Route middleware

`app/middleware/auth.global.ts` viene eseguito prima di ogni navigazione. Il suffisso `.global.ts` lo applica ovunque — i middleware non globali vanno indicati esplicitamente con `definePageMeta({ middleware: [...] })`.

```ts
// app/middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) { return }      // solo SPA, ma guardia di sicurezza
  const { isAuthenticated } = useAuth()
  const publicPaths = ['/login', '/public/athletes/registration', '/public/tournaments/matches']
  const isPublicPath = publicPaths.some(p => to.path === p || to.path.endsWith(p))

  if (!isAuthenticated.value && !isPublicPath) { return navigateTo('/login') }
  if (isAuthenticated.value && to.path === '/login') { return navigateTo('/admin') }
})
```

Da notare l'uso di `to.path.endsWith(p)` — è così che il middleware accetta anche le varianti prefissate dalla locale (`/en/public/...`) senza elencarle esplicitamente.

## Stringhe i18n

Ogni stringa visibile all'utente vive in `i18n/locales/it.json` e `i18n/locales/en.json`. In un componente:

```vue
<script setup lang="ts">
const { t } = useI18n()
</script>
<template>
  <h1>{{ t('publicMatches.title') }}</h1>
</template>
```

**Regola:** mai inserire testo in chiaro nel template. Quando aggiungi una chiave, aggiungila a entrambi i file di traduzione nello stesso commit.
