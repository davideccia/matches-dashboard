# Sanctum Auth — Implementation Guide

How `nuxt-auth-sanctum` is configured and used in this project. Use this as a reference to implement the same pattern on another Nuxt 4 project with a Laravel Sanctum backend.

---

## 1. Package

```
nuxt-auth-sanctum
```

In this project it is re-exported by the internal `@we/nuxt3` module, but the underlying package is `nuxt-auth-sanctum` (https://nuxt.com/modules/nuxt-auth-sanctum). All configuration keys, composables, and hooks are identical.

---

## 2. nuxt.config.ts

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-auth-sanctum'], // or via @we/nuxt3

  sanctum: {
    redirect: {
      onLogout: '/login', // where to send the user after logout
    },
    redirectIfUnauthenticated: true, // redirect to /login for all protected pages by default
    globalMiddleware: {
      enabled: true, // apply auth check to every route automatically
      allow404WithoutAuth: true, // let 404 pages render without forcing a login redirect
    },
  },
})
```

### What this means in practice

| Setting                           | Effect                                                                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------- |
| `globalMiddleware.enabled: true`  | Every page requires auth unless opted out via `definePageMeta`                               |
| `redirectIfUnauthenticated: true` | Unauthenticated requests redirect to the Sanctum login URL (default `/login`)                |
| `redirect.onLogout`               | Explicit redirect target after `useAuth().logout()`                                          |
| `allow404WithoutAuth`             | Unknown routes show a 404 even if the user is not logged in, instead of redirecting to login |

---

## 3. Per-page auth configuration (definePageMeta)

Override the global middleware per page with the `sanctum` key inside `definePageMeta`:

```ts
// Public page — only for guests (redirects authenticated users away)
definePageMeta({
  sanctum: { guestOnly: true },
  layout: 'empty',
})

// Excluded from auth checks entirely (accessible by anyone)
definePageMeta({
  sanctum: { excluded: true },
})

// Default (no sanctum key) — requires authentication
definePageMeta({
  layout: 'default',
})
```

### Pages in this project and their auth mode

| Page              | sanctum config    | Reason                                  |
| ----------------- | ----------------- | --------------------------------------- |
| `/login`          | `guestOnly: true` | Redirects authenticated users to home   |
| `/reset-password` | `guestOnly: true` | Password reset only for unauthenticated |
| All other pages   | _(none)_          | Protected by global middleware          |

---

## 4. useAuth() composable

Provided by the module. Available everywhere without explicit import.

```ts
const {
  user, // Ref<User | null> — the authenticated user object
  loggedIn, // ComputedRef<boolean>
  login, // (credentials) => Promise<void>
  logout, // () => Promise<void> — clears session + redirects to onLogout
  fetchUser, // () => Promise<void> — re-fetches user from /api/user (or configured endpoint)
  getUserToken, // () => Promise<string | null> — the raw auth token
  setUserToken, // (token: string) => Promise<void> — set token manually (for SSO flows)
} = useAuth()
```

### Login with email + password

```ts
await useAuth().login({ email, password })
// After this call Sanctum has set the auth cookie/token and user is populated
```

### Login via token (SSO / external auth)

```ts
const token = await fetchTokenFromExternalProvider()
await useAuth().setUserToken(token)
await useAuth().fetchUser()
navigateTo('/')
```

### Logout

```ts
await useAuth().logout()
// Clears the session, fires sanctum:logout hook, redirects to /login
```

---

## 5. User object structure

The backend (`GET /api/user` or equivalent) must return a JSON object. In this project:

```ts
interface User {
  id: number
  username: string
  email: string
  // ... any other fields from your API
}
```

Access via `useAuth().user.value`.

---

## 6. Auth plugin (app/plugins/auth.ts)

Hook into Sanctum lifecycle events to perform side-effects:

```ts
// app/plugins/auth.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('sanctum:logout', () => {
    // Clear any cached app state when the user logs out
    useUser().clear()
  })

  nuxtApp.hook('sanctum:request', (_nuxtApp, context) => {
    // Runs before every Sanctum request — use to attach extra headers if needed
  })
})
```

---

## 7. useUser() composable pattern

Wrap `useAuth()` in a project-specific composable to add permission logic and state cleanup:

```ts
// app/composables/useUser.ts
export function useUser() {
  const { user } = useAuth()

  const permissions = computed(() => user.value?.permissions ?? [])
  const isAdmin = computed(() => hasPermission('app:admin'))

  function hasPermission(val: string): boolean {
    if (isAdmin.value) { return true }
    // In dev, bypass permission checks if permissionsEnabled is false
    if (import.meta.dev && !useRuntimeConfig().public.permissionsEnabled) { return true }
    return permissions.value.includes(val)
  }

  function hasSomePermissions(vals: string[]): boolean {
    return vals.some(p => hasPermission(p))
  }

  function clear() {
    // Invalidate all cached API responses and reset persisted app state
    useApi().$getLazyInvalidate()
    clearAppOptions()
  }

  return { user, isAdmin, permissions, hasPermission, hasSomePermissions, clear }
}
```

---

## 8. Login page pattern (app/pages/login.vue)

```vue
<template>
  <div class="d-flex align-center h-100">
    <v-card style="min-width: 400px; margin: 0 auto;" class="pa-8">
      <v-form ref="form">
        <v-text-field
          v-model="model.email"
          :rules="rules.email"
          :error-messages="serverErrors.email"
          type="email"
          label="Email"
          @keyup.enter="login"
        />
        <v-text-field
          v-model="model.password"
          :rules="rules.password"
          :error-messages="serverErrors.password"
          type="password"
          label="Password"
          @keyup.enter="login"
        />
        <v-btn block color="primary" :loading="loading" @click="login">
          Accedi
        </v-btn>
      </v-form>
    </v-card>
  </div>
</template>

<script setup>
definePageMeta({
  sanctum: { guestOnly: true },
  layout: 'empty',
})

const { validatorRequired, validatorEmail } = useValidators()

const { save: login, loading, model, serverErrors } = useForm({
  form: useTemplateRef('form'),
  initialValues: { email: '', password: '' },
  onSubmit,
})

const rules = computed(() => ({
  email: [validatorRequired, validatorEmail],
  password: [validatorRequired],
}))

const { clear } = useUser()

async function onSubmit() {
  clear() // reset any stale state from a previous session
  await useAuth().login({ ...model.value })
}
</script>
```

---

## 9. Password reset flow

Two-step flow, both steps on the same page (`/reset-password`):

1. **Step 0** — user enters email → `POST /forgot_password` → backend sends verification code
2. **Step 1** — user enters code + new password → `POST /reset_password` → on success, call `useAuth().login()` directly

```ts
async function requestCode() {
  await useApi().$post('forgot_password', { email: model.value.email })
  step.value = 1
}

async function resetPassword() {
  const data = { ...model.value }
  await useApi().$post('reset_password', data, { notify: false })
  await useAuth().login({ email: data.email, password: data.password })
}
```

Both steps live on a `guestOnly: true` page.

---

## 10. Token in non-standard contexts

When you need the raw token outside of the standard cookie flow (e.g. to append to a URL for a PDF download):

```ts
const token = await useAuth().getUserToken()
const url = `${pdfUrl}?auth_token=${token}`
```

---

## 11. Logout button

```vue
<!-- anywhere in your layout -->
<v-btn @click="useAuth().logout()">
Esci
</v-btn>
```

After logout, the `sanctum:logout` hook fires and the user is redirected to `/login`.

---

## 12. Laravel backend requirements

The backend must expose these endpoints (paths relative to your `baseURL`):

| Method | Path                   | Description                                  |
| ------ | ---------------------- | -------------------------------------------- |
| `POST` | `/login`               | Email + password login — sets Sanctum cookie |
| `POST` | `/logout`              | Clears the session                           |
| `GET`  | `/api/admin/auth/user` | Returns the authenticated user object        |
| `POST` | `/forgot_password`     | Sends verification code to email             |
| `POST` | `/reset_password`      | Validates code and updates password          |

Sanctum must be configured with `stateful domains` that include your Nuxt dev/prod origin, and CORS must allow credentials.

---

## 13. Environment variables

```env
# Required
NUXT_BASE_URL=https://your-laravel-backend.test/

# Optional (dev only)
NUXT_PERMISSIONS_ENABLED=false   # bypass permission checks locally
```

---

## 14. Checklist for a new project

- [ ] Install `nuxt-auth-sanctum` and add to `modules`
- [ ] Add `sanctum` config block to `nuxt.config.ts` (see §2)
- [ ] Create `app/plugins/auth.ts` with `sanctum:logout` hook (see §6)
- [ ] Create `app/composables/useUser.ts` wrapping `useAuth()` (see §7)
- [ ] Create `app/pages/login.vue` with `guestOnly: true` (see §8)
- [ ] Create `app/pages/reset-password.vue` with `guestOnly: true` (see §9)
- [ ] Mark any public/SSO pages with `excluded: true` (see §3)
- [ ] Configure Laravel Sanctum stateful domains and CORS
- [ ] Verify backend returns user object with `permissions` array
