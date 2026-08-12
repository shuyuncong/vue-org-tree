import { defineConfig, devices } from '@playwright/test'

const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:4173/',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run build:demo:test && npm run preview:demo -- --strictPort',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: false,
    timeout: 120000
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: executablePath ? { executablePath } : {}
      }
    }
  ]
})
