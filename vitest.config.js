import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // tests/e2e holds Playwright's own real-browser suite (run via `npm run test:e2e`), not
    // Vitest tests - exclude it so Vitest's default *.spec.js include pattern doesn't pick it up
    // too. Vitest defaults `environment` to 'node' now that no suite here needs a DOM (see
    // .scratch/retire-jsdom-and-sync-xhr/spec.md).
    exclude: ['**/node_modules/**', 'tests/e2e/**'],
  },
})
