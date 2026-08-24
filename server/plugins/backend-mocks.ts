/**
 * No-op unless Playwright starts this process with
 * PLAYWRIGHT_BACKEND_MOCKS_PROXY_URL (see playwright-backend-mocks).
 */
export default defineNitroPlugin(async () => {
  const proxyUrl = process.env.PLAYWRIGHT_BACKEND_MOCKS_PROXY_URL
  if (!proxyUrl) return

  const { startBackendMocks } = await import('@playwright-backend-mocks/node')
  await startBackendMocks({
    proxyUrl,
    token: process.env.PLAYWRIGHT_BACKEND_MOCKS_TOKEN,
    clientId: 'spv-nitro',
  })
})
