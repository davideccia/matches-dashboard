# 05 — Authentication

Authentication answers two questions: *who is this visitor* and *are they allowed here*. In this app the answers live in the Laravel backend; the frontend's job is to obtain a token, attach it to requests, and gate routes.

## The mechanism: Laravel Sanctum tokens

The app uses **Laravel Sanctum** (≈ Laravel's built-in token-issuing login system) via the `nuxt-auth-sanctum` module. The configuration is in [`nuxt.config.ts`](../../nuxt.config.ts):

```ts
sanctum: {
  baseUrl: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:8081',
  mode: 'token',                       // token-based (not cookie/SPA mode)
  endpoints: {
    login:  '/api/admin/auth/login',
    user:   '/api/admin/auth/user',
    logout: '/api/admin/auth/logout',
  },
  redirect: { onLogout: '/login' },
  redirectIfUnauthenticated: true,
  globalMiddleware: {
    enabled: true,                     // every route requires auth by default…
    allow404WithoutAuth: true,
  },
}
```

Key points:

- **Token mode** — on successful login the backend returns a token; the module stores it (in a cookie named `sanctum.token.cookie`) and attaches it as an `Authorization: Bearer …` header on subsequent requests automatically.
- **Global middleware is enabled** — this is the important default. Every route is protected *unless it explicitly opts out*. So new pages are private by default; you have to mark public ones.

## Logging in

The login page is [`app/pages/login.vue`](../../app/pages/login.vue). It:

1. Declares `definePageMeta({ layout: false, sanctum: { guestOnly: true } })` — no admin sidebar, and `guestOnly` means an *already*-logged-in user visiting `/login` is redirected away.
2. Renders a `UAuthForm` (a `@nuxt/ui` component) with a **Zod** schema validating email + password.
3. On submit, calls `useAuth().login({ email, password })`, then `navigateTo('/admin')`.
4. On failure, shows a localized error alert.

It also offers buttons routing to the public registration and public scoreboard pages, so unauthenticated visitors have a way in.

## The `useAuth` composable

[`app/composables/useAuth.ts`](../../app/composables/useAuth.ts) is a thin wrapper over the module's `useSanctumAuth<User>()`:

```ts
export function useAuth() {
  const { user, isAuthenticated, login, logout: sanctumLogout, refreshIdentity } = useSanctumAuth<User>()
  const logout = () => sanctumLogout()
  return { user, isAuthenticated, login, logout, fetchUser: refreshIdentity }
}
```

- `user` — a reactive ref to the current `User` (or null).
- `isAuthenticated` — reactive boolean.
- `login(credentials)` — performs the login request.
- `logout()` — clears the token and (per config) redirects to `/login`.
- `fetchUser()` — re-fetches the current user from the backend.

The typed `User` shape comes from [`app/types/models.ts`](../../app/types/models.ts).

## Logout cleanup

[`app/plugins/auth.ts`](../../app/plugins/auth.ts) hooks the module's `sanctum:logout` event to clear locally cached data:

```ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('sanctum:logout', () => {
    useUser().clear()
  })
})
```

[`useUser().clear()`](../../app/composables/useUser.ts) calls `refreshNuxtData()`, which invalidates Nuxt's cached `useAsyncData` results so no stale, previous-user data lingers after logout. The logout action itself is wired into the sidebar's user dropdown in [`app/layouts/default.vue`](../../app/layouts/default.vue).

## Public (unauthenticated) routes

Because global middleware protects everything by default, public pages must explicitly opt out in their `definePageMeta`:

```ts
// app/pages/public/tournaments/match_records.vue
definePageMeta({ layout: false, sanctum: { excluded: true } })
```

`sanctum: { excluded: true }` exempts the page from the auth requirement. These public pages also do **not** use the authenticated [`useApi()`](07-data-flow-api.md) helper — they call the backend directly with `$fetch` against `/api/public/...` endpoints, so no token is sent. (See the scoreboard walkthrough in [Chapter 08](08-realtime-scoreboard.md).)

## The redirect chain in practice

1. Visit `/` → [`index.vue`](../../app/pages/index.vue) immediately `navigateTo('/admin')`.
2. `/admin` is protected; if there is no valid token, the Sanctum global middleware (with `redirectIfUnauthenticated: true`) sends the browser to `/login`.
3. After a successful login, the user is sent to `/admin` and stays there until the token is cleared.

> [!NOTE]
> The root `README.md` says auth is "JWT stored in localStorage". That is stale. The code uses **Sanctum tokens** managed by `nuxt-auth-sanctum` (stored in the `sanctum.token.cookie` cookie), as shown above.
