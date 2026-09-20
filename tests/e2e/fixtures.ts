import { createBackendMocks, sendAndWaitForAck, test as base, expect } from '@playwright-backend-mocks/playwright'
import { mockAnthropic, resetAnthropicMock } from './anthropic'

export type ConsoleGuard = {
  /** Ignore matching console errors for this test. Numbers match Chrome's "status of N". */
  allow: (...patterns: Array<string | number | RegExp>) => void
}

function toRegex(pattern: string | number | RegExp) {
  if (typeof pattern === 'number') return new RegExp(`status of ${pattern}\\b`)
  if (typeof pattern === 'string') return new RegExp(pattern, 'i')
  return pattern
}

function isHydrationMismatch(text: string) {
  return /hydration/i.test(text) && /mismatch/i.test(text)
}

function isAppOrigin(url: string, appOrigin: string | null) {
  if (!appOrigin) return true
  try {
    return new URL(url).origin === appOrigin
  } catch {
    return true
  }
}

export const test = base.extend<
  { consoleGuard: ConsoleGuard; resetAnthropic: void },
  { workerAnthropic: undefined }
>({
  // One Anthropic route for the worker so tests do not race register/unregister.
  workerAnthropic: [
    async ({ backendMocksConnection }, use, workerInfo) => {
      const testId = `worker-anthropic-${workerInfo.workerIndex}`
      const mocks = createBackendMocks({
        connection: backendMocksConnection,
        testId,
      })
      try {
        await sendAndWaitForAck(
          backendMocksConnection,
          {
            type: 'test:register',
            testId,
            title: 'worker Anthropic defaults',
            file: 'tests/e2e/fixtures.ts',
            workerId: String(workerInfo.workerIndex),
          },
          (message) => message.type === 'test:registered' && message.testId === testId,
        )
        await mockAnthropic(mocks)
        await use(undefined)
      } finally {
        await mocks.dispose()
      }
    },
    { scope: 'worker', auto: true },
  ],
  resetAnthropic: [
    async ({}, use) => {
      resetAnthropicMock()
      await use()
    },
    { auto: true },
  ],
  consoleGuard: [
    async ({ page, baseURL }, use) => {
      const appOrigin = baseURL ? new URL(baseURL).origin : null
      const allowed: RegExp[] = []
      const unexpected: string[] = []

      function record(text: string, sourceUrl?: string) {
        if (sourceUrl && !isAppOrigin(sourceUrl, appOrigin)) return
        if (appOrigin && !isAppOrigin(page.url(), appOrigin)) return
        if (allowed.some((re) => re.test(text))) return
        if (!unexpected.includes(text)) unexpected.push(text)
      }

      page.on('console', (msg) => {
        const text = msg.text()
        if (msg.type() === 'error' || isHydrationMismatch(text)) {
          record(text, msg.location().url)
        }
      })
      page.on('pageerror', (err) => record(err.message))

      await use({
        allow: (...patterns) => {
          allowed.push(...patterns.map(toRegex))
        },
      })

      expect(unexpected, `Unexpected console errors:\n${unexpected.map((t) => `- ${t}`).join('\n')}`).toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
