import type { User } from '~/types/models'

export function useAuth() {
  const { user: sanctumUser, isAuthenticated, login, logout: sanctumLogout, refreshIdentity } = useSanctumAuth<{ data: User }>()

  const user = computed(() => sanctumUser.value?.data ?? null)
  const logout = () => sanctumLogout()

  return {
    user,
    isAuthenticated,
    login,
    logout,
    fetchUser: refreshIdentity,
  }
}
