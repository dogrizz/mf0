# 03: Fleet builder characterization tests

**What to build:** A DOM-level interaction test suite for the fleet builder page (`index.html` /
`builder.js`), driving it exactly as a player would (click, fill, toggle) and asserting on resulting DOM
and `localStorage['mf0-tools']`. Written against the *current* Mithril implementation as a
characterization test — the regression net that must pass unmodified once this page is later rewritten in
Vue. This page is highest-risk and migrates first, so its cross-component interactions are covered
specifically.

**Blocked by:** 01 (Add dev-only test tooling)

**Status:** ready-for-agent

- [ ] Suite drives the rendered page via DOM events: add a ship, add systems, add a mech company via a
      catapult system, change ship class
- [ ] Covers the catapult-system-enables-mech-company interaction
- [ ] Covers ship class changes affecting which systems are available
- [ ] Covers live PPA recalculation as the roster changes
- [ ] Asserts on `localStorage['mf0-tools']` contents after interactions, not on Mithril-specific internals
- [ ] Suite passes against the current, unmodified Mithril implementation
