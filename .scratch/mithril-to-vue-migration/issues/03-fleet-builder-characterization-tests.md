# 03: Fleet builder characterization tests

**What to build:** A DOM-level interaction test suite for the fleet builder page (`index.html` /
`builder.js`), driving it exactly as a player would (click, fill, toggle) and asserting on resulting DOM
and `localStorage['mf0-tools']`. Written against the *current* Mithril implementation as a
characterization test — the regression net that must pass unmodified once this page is later rewritten in
Vue. This page is highest-risk and migrates first, so its cross-component interactions are covered
specifically.

**Blocked by:** 01 (Add dev-only test tooling)

**Status:** resolved

- [x] Suite drives the rendered page via DOM events: add a ship, add systems, add a mech company via a
      catapult system, change ship class
- [x] Covers the catapult-system-enables-mech-company interaction
- [x] Covers ship class changes affecting which systems are available
- [x] Covers live PPA recalculation as the roster changes
- [x] Asserts on `localStorage['mf0-tools']` contents after interactions, not on Mithril-specific internals
- [x] Suite passes against the current, unmodified Mithril implementation

## Comments

Implemented as `tests/builder.test.js` (6 tests) against a real jsdom-rendered page, driven with
`click()`/`setValue()` DOM events and asserted against rendered DOM plus `localStorage['mf0-tools']`.
`tests/helpers/load-builder-page.js` builds the page by inlining `mithril.min.js` (from a new
`mithril@2.2.2` dev dependency, matching the CDN version pinned in `index.html`),
`lz-string.min.js`, `support.js`, `common.js`, and `builder.js` as real `<script>` tags inside a
`jsdom` document (`runScripts: 'dangerously'`, `pretendToBeVisual: true` for `requestAnimationFrame`,
which Mithril's autoredraw needs). Inline `<script>` tags were required rather than sequential
`window.eval()` calls (the pattern ticket 02 used for `support.js` alone): jsdom only threads
top-level `const`/`let` bindings - e.g. `ShipSystem`/`ShipType` - across scripts parsed and run
together as part of the same document, matching how a browser shares one global lexical scope
across `<script>` elements; separate `eval()` calls don't share that scope, so `builder.js` couldn't
see `support.js`'s `const` exports that way. Checkbox interactions use the element's native
`.click()` (not a dispatched synthetic `Event`), since only the native method runs jsdom's
toggle-then-fire-click activation behavior. `npm audit` remains at 0 findings after adding `mithril`.
