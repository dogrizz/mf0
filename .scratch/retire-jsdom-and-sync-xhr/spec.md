# Retire jsdom page tests, then drop synchronous XHR template loading

Triage: ready-for-agent

## Problem Statement

13 of the app's 15 Vue components load their `.template.html` file with a synchronous
`XMLHttpRequest` — a deprecated web API — instead of the `fetch()` + `Vue.defineAsyncComponent()`
pattern the two shared components (`shared/vue-app-footer.js`, `shared/vue-options-link.js`)
already use. It exists only as a workaround: the jsdom-based page test suites
(`tests/builder.test.js`, `tests/battle.test.js`, `tests/battles.test.js`) mount a page by inlining
every production `.js` file as a `<script>` tag and assert on the DOM with no `await` before the
first query, mirroring the old Mithril page's fully synchronous render. An async component renders
nothing until its template promise resolves, which broke that assumption, so sync XHR was used to
keep mount synchronous instead.

jsdom itself was only adopted to run these page tests "framework-agnostically" against both Mithril
and Vue during the migration recorded in `.scratch/mithril-to-vue-migration/`. That migration is
done and fully merged — Vue is the only framework left, so the constraint no longer applies. jsdom
also brings its own ongoing cost: no native `fetch`, no synchronous file-backed XHR, and no layout
engine, all requiring hand-rolled polyfills/mocks and script-inlining/indirect-eval gymnastics in
`tests/helpers/`. `tests/e2e/` (added later for the tactical redesign, PR #26) already runs
Playwright against the real static site for CSS/layout assertions jsdom can't make — real-browser
testing resolves `fetch()` and `defineAsyncComponent` the same way an actual user's browser does,
eliminating every one of those workarounds in one move.

## Solution

Retire jsdom for page-level tests entirely, migrating the three characterization suites
(fleet builder, battle tracker, battles list) to Playwright specs that run against the real static
site, following the pattern `tests/e2e/battle-tactical.spec.js`/`battles-tactical.spec.js` already
established. Once no test depends on synchronous mount anymore, convert all 13 sync-XHR components
to the `fetch()` + `defineAsyncComponent` pattern already proven by the two shared components. This
ships as two sequenced tickets/PRs — Playwright migration first (verified green against today's
still-sync-XHR components, since a real browser doesn't care which template-loading mechanism a
component uses), then the component conversion — so the riskier production-code change is verified
by the new real-browser suite from the moment it lands, not by a jsdom suite that's about to be
deleted anyway.

## User Stories

1. As a maintainer, I want the page-level test suites to run against real browsers, so that they exercise the exact fetch/rendering behavior real users experience instead of a jsdom approximation.
2. As a maintainer, I want to drop the `jsdom` devDependency, so that the test toolchain has one fewer environment-specific compatibility surface to maintain (no fetch polyfill, no synchronous-XHR-off-disk shim, no script-inlining/eval workarounds).
3. As a maintainer, I want the fleet builder, battle tracker, and battles list page tests to each be Playwright specs living in `tests/e2e/`, so that all page-level coverage (behavior and layout) lives in one place and runs through one tool.
4. As a maintainer, I want the new `builder.spec.js`/`battle.spec.js`/`battles.spec.js` files to stay separate from the existing `*-tactical.spec.js` files, so that behavior assertions and CSS/layout assertions remain independently scoped and easy to scan, matching the separation already established for the battle and battles-list pages.
5. As a maintainer, I want each new Playwright spec to be self-contained (its own inline fixtures/seeding helpers), so that the suite matches the existing convention in `tests/e2e/` rather than introducing a new shared-helpers pattern just for this migration.
6. As a maintainer, I want the new specs to seed state through the app's own real functions (`storeBattle()`, `localStorage` writes matching what `builder.js` itself reads on load) rather than by reaching into framework internals, so the tests keep verifying real user-facing behavior, continuing the "characterization test" discipline the original jsdom suites used.
7. As a maintainer, I want `smoke.test.js` and `support.test.js` (pure logic, not pages) to keep running under Vitest without needing jsdom, so that fast unit-level feedback doesn't regress to requiring a browser.
8. As a maintainer, I want `support.test.js`'s `localStorage` dependency satisfied by a small in-memory polyfill rather than Node's experimental, file-backed `--experimental-webstorage`, so that these tests stay fast, hermetic, and don't need an experimental flag.
9. As a maintainer, I want `npm test` (Vitest) and `npm run test:e2e` (Playwright) to remain two separate commands, so that fast unit tests and slower real-browser tests stay independently runnable, matching today's workflow.
10. As a maintainer running Playwright locally on NixOS, I want the existing `nix-shell`/`shell.nix` workaround (documented in the gitignored `CLAUDE.local.md`) to keep working unchanged for the expanded Playwright suite, so that no new machine-specific setup is needed for this migration.
11. As a maintainer, I want the sync-XHR-vs-jsdom rationale comments removed from all 13 component files once they no longer apply, so that the code doesn't carry stale justifications for a workaround that's been removed.
12. As a maintainer, I want all 13 components to load templates the same way the two existing shared components already do, so that there's exactly one template-loading pattern in the codebase instead of two.
13. As a maintainer, I want the component-conversion ticket to ship only after the Playwright migration ticket is merged and green, so that the riskier production-code change is verified by a real-browser suite from the start.
14. As a maintainer, I want each ticket to land as its own PR on its own fresh worktree, so that the test-infrastructure swap and the production-code behavior change are independently reviewable and revertable.
15. As a site visitor using the fleet builder, battle tracker, or battles list, I want the pages to render and behave identically before and after this change, so that removing a testing/implementation detail causes no visible regression.
16. As a maintainer, I don't want CI (GitHub Actions or similar) added as part of this work, so that scope stays limited to the local test-tooling swap, since development currently happens from a single machine.

## Implementation Decisions

**Ticket 01 — migrate page tests to Playwright:**
- Delete `tests/builder.test.js`, `tests/battle.test.js`, `tests/battles.test.js`, and
  `tests/helpers/page.js`, `load-builder-page.js`, `load-battle-page.js`, `load-battles-page.js`.
- Create `tests/e2e/builder.spec.js`, `battle.spec.js`, `battles.spec.js`: separate files from the
  existing `*-tactical.spec.js`, self-contained (own inline fixtures/seeding, no new shared-helpers
  module), using Playwright locators/`expect(...).toHaveCount/toHaveText` instead of raw DOM
  queries, `locator.click()`/`fill()`/`selectOption()` instead of the old `click()`/`setValue()`
  helpers, and no manual redraw/flush step (Playwright's assertions auto-retry).
- Seed `battle.spec.js`/`battles.spec.js` via `page.evaluate` calling the real `storeBattle()`,
  matching `seedBattle()` in the existing tactical specs. Seed `builder.spec.js` (no existing
  precedent) by navigating to `/index.html`, writing `localStorage['mf0-tools']` via
  `page.evaluate`, then reloading.
- Move `smoke.test.js`/`support.test.js` off jsdom: add `tests/helpers/local-storage-mock.js` (a
  small in-memory, `Map`-backed `localStorage` polyfill assigned to `globalThis.localStorage`),
  imported for its side effect at the top of `support.test.js`.
- `vitest.config.js`: remove `environment: 'jsdom'` (Vitest defaults to `'node'`); keep the
  existing `exclude: ['**/node_modules/**', 'tests/e2e/**']`.
- `package.json`: remove the `jsdom` devDependency. `npm test`/`npm run test:e2e` stay separate
  commands.

**Ticket 02 — convert components to `fetch()` + `defineAsyncComponent`:**
- Convert all 13 sync-XHR components (`vue-builder-app.js`, `vue-battle-app.js`,
  `vue-battles-app.js`, and all `builder/components/vue-builder-*.js`/
  `battle/components/vue-battle-*.js` sub-components) to
  `Vue.defineAsyncComponent(async () => { const template = await fetch(...).then(r => r.text()); return {...} })`,
  matching `shared/vue-app-footer.js`/`shared/vue-options-link.js`'s exact structure — including
  their `document.currentScript.src || new URL(...)` fallback for same-file-location URL
  resolution. `props`/`setup()` bodies/logic are unchanged, just moved inside the async factory's
  returned object.
- No changes needed to the three page entry scripts (`builder.js`/`battle.js`/`battles.js`) —
  `Vue.createApp()` accepts a `defineAsyncComponent`-wrapped root the same as a plain component
  object; `app.mount()` stays synchronous and Vue renders once the async root resolves.

**Testing seam:** the single seam for all page-level tests becomes "a real browser loading the
actual served HTML page via Playwright" (via `playwright.config.js`'s existing
`python3 -m http.server` `webServer`), replacing the two seams that existed before (jsdom with
mocked `fetch`/XHR for behavior, Playwright for layout) with one.

## Testing Decisions

- A good test here asserts on rendered DOM state and `localStorage` content reached through the
  app's own public behavior (clicks, form fills, navigation) — never on Vue/framework internals —
  continuing the "characterization test" discipline the original jsdom suites established.
- Pages tested end-to-end via the new Playwright specs: `index.html` (fleet builder), `battle.html`
  (battle tracker), `battles.html` (battles list). Pure logic (`calculatePPA`, dice notation,
  `support/storage.js` CRUD) stays covered by the existing `support.test.js` Vitest suite, now
  jsdom-free.
- Prior art: `tests/e2e/battle-tactical.spec.js` and `tests/e2e/battles-tactical.spec.js` are the
  direct template for the new specs' structure and conventions.

## Out of Scope

- Adding CI (GitHub Actions or otherwise) to run these tests automatically.
- Any change to game logic, domain model, or visual/CSS design.
- Splitting components into smaller test-only units, or adding component-level (as opposed to
  page-level) tests.
- Merging `npm test` and `npm run test:e2e` into a single command.

## Further Notes

- Scoped through a grilling session; confirmed decisions: separate spec files (not merged with
  `-tactical` specs), self-contained specs (no new shared helpers module), two sequenced PRs (tests
  first), `npm test`/`test:e2e` stay split, no CI.
- Node 24 (this machine) has no stable in-memory `localStorage` — `--experimental-webstorage` is
  file-backed and still experimental (confirmed by direct testing) — hence the small custom
  polyfill instead of relying on it.
- Playwright and `@playwright/test` are already pinned at `1.63.0` in `package.json` and wired to
  nixpkgs' prebuilt Chromium via the gitignored `shell.nix` (see `CLAUDE.local.md`) — no new
  Playwright setup needed, just more specs.
