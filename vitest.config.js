import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    // tests/e2e holds Playwright's own real-browser suite (run via `npm run test:e2e`), not jsdom
    // tests - exclude it so vitest's default *.spec.js include pattern doesn't pick it up too.
    exclude: ['**/node_modules/**', 'tests/e2e/**'],
  },
})
