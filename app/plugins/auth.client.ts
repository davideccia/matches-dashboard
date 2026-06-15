export default defineNuxtPlugin(async () => {
  // Token/user are hydrated from localStorage by useAuth()'s useState initializers.
  // fetchUser() validates the token against the server on every reload and resets
  // auth state if it is invalid or expired.
  await useAuth().fetchUser()
})
