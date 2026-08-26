import { defineConfig, devices } from '@playwright/test'
import type { BackendMocksWorkerOptions } from '@playwright-backend-mocks/playwright'

const PROXY_URL = 'http://127.0.0.1:4310'
const BASE_URL = 'http://localhost:3100'

export default defineConfig<object, BackendMocksWorkerOptions>({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    backendMocksProxyUrl: PROXY_URL,
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
              },
    },
  ],
})
