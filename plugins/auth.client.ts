export default defineNuxtPlugin(() => {
  const { init } = useAuth()
  return init()
})
