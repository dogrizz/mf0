# 01: Migrate page tests to Playwright

**What to build:** All page-level test coverage for the fleet builder, battle tracker, and battles
list runs against the real static site through Playwright instead of jsdom. `tests/builder.test.js`,
`tests/battle.test.js`, `tests/battles.test.js` and their jsdom-only helpers are gone, replaced by
`tests/e2e/builder.spec.js`, `battle.spec.js`, `battles.spec.js` — separate files from the existing
`*-tactical.spec.js` (behavior vs. layout stays split), self-contained like those files (own inline
fixtures/seeding helpers, no new shared-helpers module). `smoke.test.js`/`support.test.js` keep
running fast under Vitest without jsdom. `jsdom` is dropped as a dependency entirely. The 13
components that currently load their templates via synchronous XHR are untouched in this ticket —
a real browser doesn't care which template-loading mechanism a component uses, so this ticket
proves the new suite is green against today's implementation before ticket 02 changes it.

**Blocked by:** None (can start immediately)

**Status:** done (PR: see this ticket's PR)

- [x] `tests/e2e/builder.spec.js`, `battle.spec.js`, `battles.spec.js` exist and cover the same
      behavior the deleted jsdom suites did: builder — add player, add ship, system class/attack-type
      selection, dice notation, PPA/total scoreboard, "Fight!" → battle handoff; battle — per-system
      damage/disable, mech company fuel toggle, ship capture/transfer between fleets, destruction;
      battles — empty state, listing saved battles, resume link, forfeit
- [x] Each new spec seeds state through the app's own real functions (`storeBattle()`,
      `localStorage` writes matching what the page itself reads on load via `page.evaluate`), not by
      reaching into Vue internals, and uses Playwright locators/auto-retrying assertions rather than
      raw DOM queries or a manual redraw/flush step
- [x] `tests/builder.test.js`, `tests/battle.test.js`, `tests/battles.test.js`, and
      `tests/helpers/page.js`, `load-builder-page.js`, `load-battle-page.js`, `load-battles-page.js`
      are deleted
- [x] `tests/support.test.js`'s `localStorage` dependency is satisfied by a small in-memory
      polyfill (not jsdom, not Node's experimental file-backed webstorage); `vitest.config.js` no
      longer sets `environment: 'jsdom'`
- [x] `jsdom` is removed from `package.json` devDependencies
- [x] `npm test` and `npm run test:e2e` remain two separate commands; both pass, with
      `npm run test:e2e` green against today's still-sync-XHR components

**Comments:**
- `support/battle.js`'s `readBattle` migration also reads `self.crypto.randomUUID()` - `self` has
  no Node equivalent (jsdom used to provide it), so `tests/helpers/local-storage-mock.js` aliases
  `globalThis.self = globalThis` alongside its localStorage polyfill to keep `support.test.js`
  green without jsdom.
- Fixed two stale comments in the pre-existing `tests/e2e/battle-tactical.spec.js` /
  `battles-tactical.spec.js` that referenced the now-deleted jsdom suites (found by
  `/code-review medium`).
