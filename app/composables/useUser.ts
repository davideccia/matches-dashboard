export function useUser() {
  const { user } = useAuth()

  function clear() {
    refreshNuxtData()
  }

  return { user, clear }
}
