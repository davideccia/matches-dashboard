import type { User } from '~/types/models'

export function useAuth() {
  const { user, isAuthenticated, login, logout: sanctumLogout, refreshIdentity } = useSanctumAuth<User>()

  const logout = () => sanctumLogout()

  return {
    user,
    isAuthenticated,
    login,
    logout,
    fetchUser: refreshIdentity,
  }
}
