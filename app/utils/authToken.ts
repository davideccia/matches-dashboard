import type { NuxtApp } from '#app'
import { unref } from 'vue'

export const AUTH_TOKEN_COOKIE = 'sanctum.token.cookie'

/** Allineato all'`expiration` dei token Sanctum lato API (1 settimana). */
export const AUTH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60

/**
 * Opzioni del cookie che contiene il token Bearer.
 *
 * `httpOnly` non è possibile: il client JS deve leggere il token per comporre
 * l'header `Authorization` (vedi docs/security-issues #1). Quello che si può
 * fare è restringere il resto: `sameSite: 'strict'`, `path` esplicito e una
 * scadenza pari al TTL del token lato API, così il cookie muore col token
 * invece di restare in giro come credenziale già invalida.
 */
export function authTokenCookieOptions() {
  return {
    secure: useRequestURL().protocol.startsWith('https'),
    sameSite: 'strict' as const,
    path: '/',
    maxAge: AUTH_TOKEN_MAX_AGE,
  }
}

export function useAuthTokenCookie() {
  return useCookie(AUTH_TOKEN_COOKIE, authTokenCookieOptions())
}

/** Sostituisce il `cookieTokenStorage` di default di nuxt-auth-sanctum. */
export const authTokenStorage = {
  async get(app: NuxtApp) {
    return app.runWithContext(() => {
      const cookie = useCookie(AUTH_TOKEN_COOKIE, { readonly: true, watch: false })
      return unref(cookie.value) ?? undefined
    })
  },
  async set(app: NuxtApp, token?: string) {
    await app.runWithContext(() => {
      useAuthTokenCookie().value = token ?? null
    })
  },
}
