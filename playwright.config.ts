import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, devices } from '@playwright/test'
import type { BackendMocksWorkerOptions } from '@playwright-backend-mocks/playwright'

function applyEnvFile(name: string) {
  const file = resolve(process.cwd(), name)
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (process.env[key] === undefined) process.env[key] = value
  }
}

applyEnvFile('.env.test')

const PROXY_URL = 'http://127.0.0.1:4310'
const BASE_URL = 'http://localhost:3100'

export default defineConfig<object, BackendMocksWorkerOptions>({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      // GitHub ubuntu vs local Linux font rasterization (~1% on lookup-result).
      maxDiffPixelRatio: 0.02,
    },
  },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    backendMocksProxyUrl: PROXY_URL,
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'playwright-backend-mocks-proxy --host 127.0.0.1 --port 4310',
      url: `${PROXY_URL}/health`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run start:e2e',
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        PLAYWRIGHT_BACKEND_MOCKS_PROXY_URL: PROXY_URL,
        NITRO_PORT: '3100',
        PORT: '3100',
        // Pin hero showcase so visual snapshots do not drift every 3 days.
        SHOWCASE_PERIOD: '0',
      },
    },
  ],
})
