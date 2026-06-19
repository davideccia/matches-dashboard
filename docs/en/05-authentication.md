# 05 — Authentication

> See also: [06 — Data flow & the API layer](06-data-flow-api.md), [03 — Project structure](03-project-structure.md)

Authentication is entirely delegated to the Laravel API via **Laravel Sanctum** in *token* mode. The frontend never verifies passwords or issues tokens: it sends credentials, receives a token, stores it in a cookie, and attaches it to subsequent requests. All of this is orchestrated by the `nuxt-auth-sanctum` module.

## Concepts

- **Sanctum** → Laravel's authentication system. In *token mode* (≈ a concert wristband: you show it at the entrance of every restricted area) the client receives a token at login and sends it as an `Authorization: Bearer …` header on every protected request.
- **Global middleware** → a layer that intercepts *all* routes and blocks the ones requiring authentication, redirecting unauthenticated users to login.

## Configuration

It all starts in [`nuxt.config.ts`](../../nuxt.config.ts) (lines 70-86):

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
    enabled: true,           // ← every route is protected by default
    allow404WithoutAuth: true,
  },
}
```

The crucial point: `globalMiddleware.enabled: true` means **every page requires authentication by default**. Public pages must explicitly *opt out* of protection.

## Public pages: opting out

A page declares itself public with `definePageMeta`. Real examples:

```ts
// app/pages/public/tournaments/match_records.vue, line 164
definePageMeta({ layout: false, sanctum: { excluded: true } })
```

```ts
// app/pages/login.vue, lines 108-111
definePageMeta({
  layout: false,
  sanctum: { guestOnly: true },   // unauthenticated users only
})
```

| Meta | Effect |
|------|--------|
| `sanctum: { excluded: true }` | The route is excluded from the auth check (`/public/**` pages). |
| `sanctum: { guestOnly: true }` | The route is accessible **only** to unauthenticated users (e.g. `/login`): an already-logged-in user is redirected away. |
| (no meta) | Protected route: without a token you end up at `/login`. |

## The login flow

In [`app/pages/login.vue`](../../app/pages/login.vue) (lines 143-155):

```ts
async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    clear()                                  // clears any previous state
    await useAuth().login({ email, password })
    await navigateTo('/admin')
  } catch {
    errorMsg.value = t('login.error')
  } finally {
    loading.value = false
  }
}
```

The form is validated with Zod (`z.email()`, `z.string().min(1)`) before the API is even called.

## The `useAuth` composable

[`app/composables/useAuth.ts`](../../app/composables/useAuth.ts) is a thin wrapper over the module's `useSanctumAuth()`:

```ts
export function useAuth() {
  const { user: sanctumUser, isAuthenticated, login, logout, refreshIdentity } = useSanctumAuth<{ data: User }>()
  const user = computed(() => sanctumUser.value?.data ?? null)  // unwraps { data: … }
  return { user, isAuthenticated, login, logout: () => logout(), fetchUser: refreshIdentity }
}
```

The only real added logic is the *unwrap* of `{ data: User }`: Laravel's user endpoint wraps the resource in `data`, and here it's flattened to `user`.

## Logout and state cleanup

The [`app/plugins/auth.ts`](../../app/plugins/auth.ts) plugin hooks into Sanctum's logout event:

```ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('sanctum:logout', () => {
    useUser().clear()
  })
})
```

`useUser().clear()` ([`useUser.ts`](../../app/composables/useUser.ts)) calls `refreshNuxtData()`, which invalidates the `useAsyncData`/`useLazyAsyncData` caches so no data from the previous user survives the session.

## The root redirect

[`app/pages/index.vue`](../../app/pages/index.vue) is essentially a redirect:

```ts
const localePath = useLocalePath()
await navigateTo(localePath('/admin'), { replace: true })
```

It always heads to `/admin`; it's then Sanctum's global middleware that diverts to `/login` if there's no valid token. `localePath()` keeps the correct language prefix (e.g. `/en/admin`).

## Authenticated downloads

There's one case that bypasses the Sanctum client: downloading binary files (PDFs). See `download()` in [Chapter 06](06-data-flow-api.md): it manually reads the token from the `sanctum.token.cookie` cookie and attaches it as an `Authorization` header.
