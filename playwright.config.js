import { defineConfig, devices } from '@playwright/test'

// Real-browser tests for CSS/layout behavior that tests/*.test.js's jsdom suite can't see (jsdom
// has no layout engine, so it can't catch overflow, cascade bugs, or media-query behavior).
export default defineConfig({
  testDir: 'tests/e2e',
  webServer: {
    command: 'python3 -m http.server 8934',
    url: 'http://127.0.0.1:8934',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://127.0.0.1:8934',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
