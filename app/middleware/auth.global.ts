export default defineNuxtRouteMiddleware((to) => {
  // localStorage is not available on the server — skip the check there.
  if (import.meta.server) { return }

  const { isAuthenticated } = useAuth()
  const loginPath = '/login'
  const publicPaths = ['/login', '/public/athletes/registration', '/public/tournaments/matches']
  const isPublicPath = publicPaths.some(p => to.path === p || to.path.endsWith(p))

  if (!isAuthenticated.value && !isPublicPath) {
    return navigateTo(loginPath)
  }
  if (isAuthenticated.value && to.path === loginPath) {
    return navigateTo('/admin')
  }
})
