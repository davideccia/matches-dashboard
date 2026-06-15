export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('sanctum:logout', () => {
    useUser().clear()
  })
})
