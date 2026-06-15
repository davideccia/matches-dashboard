import type { User } from '~/types/models'

export type AuthUser = Omit<User, 'createdAt'>

const TOKEN_KEY = 'auth-token'
const USER_KEY = 'auth-user'

/** Reactive token backed by localStorage (client-only). */
function useTokenStorage() {
  const token = useState<string | null>(TOKEN_KEY, () => {
    if (import.meta.client) {
      return localStorage.getItem(TOKEN_KEY)
    }
    return null
  })

  const setToken = (value: string | null) => {
    token.value = value
    if (import.meta.client) {
      if (value) {
        localStorage.setItem(TOKEN_KEY, value)
      } else {
        localStorage.removeItem(TOKEN_KEY)
      }
    }
  }

  return { token, setToken }
}

export function useAuth() {
  const { token, setToken } = useTokenStorage()
  const user = useState<AuthUser | null>('auth-user', () => {
    if (import.meta.client) {
      const stored = localStorage.getItem(USER_KEY)
      return stored ? JSON.parse(stored) as AuthUser : null
    }
    return null
  })

  const setUser = (value: AuthUser | null) => {
    user.value = value
    if (import.meta.client) {
      if (value) {
        localStorage.setItem(USER_KEY, JSON.stringify(value))
      } else { localStorage.removeItem(USER_KEY) }
    }
  }
  const isAuthenticated = computed(() => !!token.value)

  const login = async (email: string, password: string) => {
    const { get, post } = useApi()
    const data = await post<{ token: string }>('/api/desktop/auth/login', { email, password })
    setToken(data.token)
    setUser(await get<AuthUser>('/api/desktop/auth/user'))
  }

  const logout = async () => {
    const { post } = useApi()
    try {
      await post('/api/desktop/auth/logout')
    } finally {
      setToken(null)
      setUser(null)
      await navigateTo('/login')
    }
  }

  const fetchUser = async () => {
    if (!token.value) { return }
    const { get } = useApi()
    try {
      setUser(await get<AuthUser>('/api/desktop/auth/user'))
    } catch {
      // Token invalid or expired: full reset. The auth.global.ts middleware
      // will then see isAuthenticated=false and redirect to /login.
      setToken(null)
      setUser(null)
    }
  }

  return { token, user, isAuthenticated, login, logout, fetchUser }
}
