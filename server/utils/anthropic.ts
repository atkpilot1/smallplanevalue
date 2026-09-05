import { createAnthropic } from '@ai-sdk/anthropic'

let _client: ReturnType<typeof createAnthropic> | null = null

function anthropicFetch(input: RequestInfo | URL, init?: RequestInit) {
  // E2E only: a keep-alive socket opened by a mock passthrough bypasses MSW
  // and later tests hit the real API with the CI placeholder key.
  if (!process.env.PLAYWRIGHT_BACKEND_MOCKS_PROXY_URL) {
    return fetch(input, init)
  }
  const headers = new Headers(init?.headers)
  headers.set('connection', 'close')
  return fetch(input, { ...init, headers })
}

export function anthropic() {
  const config = useRuntimeConfig()
  if (!config.anthropicApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Anthropic API key not configured' })
  }
  if (!_client) {
    _client = createAnthropic({
      apiKey: config.anthropicApiKey,
      fetch: anthropicFetch,
    })
  }
  return _client
}

export function models() {
  const config = useRuntimeConfig()
  return {
    main: config.modelMain,
    fast: config.modelFast,
  }
}
