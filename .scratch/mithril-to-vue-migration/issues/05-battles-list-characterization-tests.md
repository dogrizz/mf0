# 05: Battles list characterization tests

**What to build:** A DOM-level interaction test suite for the battles list page (`battles.html` /
`battles.js`), asserting on resulting DOM and `localStorage['mf0-battles']`. Written against the *current*
Mithril implementation as the regression net for that page's later Vue rewrite.

**Blocked by:** 01 (Add dev-only test tooling)

**Status:** resolved

- [x] Covers listing of saved battles read from `localStorage['mf0-battles']`
- [x] Covers the resume action navigating to the correct `battle.html?battleId=<id>`
- [x] Covers the forfeit/delete action removing a battle from `localStorage['mf0-battles']`
- [x] Suite passes against the current, unmodified Mithril implementation

## Comments

Implemented as `tests/battles.test.js` (5 tests) against a real jsdom-rendered page, driven with
`click()` DOM events and asserted against rendered DOM plus `localStorage['mf0-battles']`.
`tests/helpers/load-battles-page.js` builds the page the way `battles.html` does (`support.js` ->
`common.js` -> `battles.js`, Mithril from the vendored dev dependency); `lz-string.min.js` is
omitted since the battles list only reads `date`/id metadata and never decompresses a battle's
`data` payload. `mountBattlesPage(battles)` seeds `localStorage['mf0-battles']` via an inline
`<script>` that runs before Mithril and `battles.js` (so it's present when `battles.js`'s `oninit`
reads it synchronously as part of `m.mount`), rather than setting `localStorage` after mount, since
by the time control returns from mounting, `oninit` has already read whatever was there.

The classic-script-inlining/`redraw`/`click` scaffold introduced by ticket 03's
`load-builder-page.js` was factored out into a shared `tests/helpers/page.js` (`mountPage`,
`redraw`, `click`) during this ticket's code review, since a second near-identical copy already
existed and ticket 04's battle-tracker suite will need the same primitive a third time;
`load-builder-page.js` was updated to build on it without changing its public API, and the existing
`builder.test.js` suite still passes.
