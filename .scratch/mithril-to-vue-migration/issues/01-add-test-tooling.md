# 01: Add dev-only test tooling

**What to build:** A dev-only test runner and DOM environment so the project can run automated tests
against the current static HTML/JS pages, with zero effect on the deployed site (no bundler, no build
step for GitHub Pages). This is the harness only — no test content yet.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `package.json` added, scoped to dev dependencies only (test runner + DOM environment)
- [x] A single `npm` script runs the test suite
- [x] A trivial smoke test (e.g. asserting `1 + 1 === 2`) passes via that script
- [x] `node_modules/` and any test-artifact output directories added to `.gitignore`
- [x] No changes to any deployed file (`*.html`, `*.js` loaded by the pages) or to how GitHub Pages serves the site

## Comments

Implemented with Vitest 5 + jsdom (`vitest.config.js`, `environment: 'jsdom'`) so later page-level DOM
tests (issues 03-05) have an environment ready. Initially pinned to vitest 2.x/jsdom 25, but that pulled
a vulnerable `esbuild`/`vite` chain via `@vitest/mocker`; bumped to vitest 5.0.2 / jsdom 30.1.1, which
installs with zero `npm audit` findings. `node_modules/` and `coverage` were already covered by the
existing `.gitignore` — no new entries were needed. Smoke test lives at `tests/smoke.test.js`, run via
`npm test`.
