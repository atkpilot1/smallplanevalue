import { createAnthropic } from '@ai-sdk/anthropic'

let _client: ReturnType<typeof createAnthropic> | null = null

export function anthropic() {
  const config = useRuntimeConfig()
  if (!config.anthropicApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Anthropic API key not configured' })
  }
  if (!_client) {
    _client = createAnthropic({ apiKey: config.anthropicApiKey })
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
