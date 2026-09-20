export default defineNuxtPlugin((nuxtApp) => {
  const { init } = useAuth()
  // Nuxt waits for a returned plugin promise before hydrating. Restoring
  // the session first would paint "Manage Account" against SSR "Sign In".
  nuxtApp.hook('app:mounted', () => {
    void init()
  })
})
