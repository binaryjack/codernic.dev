import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/journeys',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:9324',
    trace: 'on-first-retry',
    video: 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  webServer: {
    command: 'VITE_CODERNIC_WS_URL=ws://127.0.0.1:48321 pnpm dev --port 9324',
    url: 'http://localhost:9324',
    reuseExistingServer: !process.env.CI,
  },
});
