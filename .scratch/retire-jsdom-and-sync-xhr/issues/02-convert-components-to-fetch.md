# 02: Convert components to fetch() + defineAsyncComponent

**What to build:** Every Vue component in the app loads its template the same way — via `fetch()` +
`Vue.defineAsyncComponent()`, matching the pattern `shared/vue-app-footer.js`/
`shared/vue-options-link.js` already use — with zero synchronous `XMLHttpRequest` calls left
anywhere in production code. This removes the last reason the codebase had two different
template-loading mechanisms: nothing depends on synchronous mount anymore now that ticket 01's
Playwright suite verifies real rendered behavior in a real browser instead of asserting on a jsdom
DOM with no `await` before the first query.

**Blocked by:** 01

**Status:** done

- [x] All 13 previously sync-XHR components (the 3 page-root components mounted via
      `Vue.createApp(...)`, plus all `builder/components/*` and `battle/components/*`
      sub-components) load their templates via `Vue.defineAsyncComponent(async () => ...)` +
      `fetch()`, structured the same way as the existing shared components (including the
      `document.currentScript.src`-relative URL resolution with its same-file-location fallback)
- [x] `props`/`setup()` bodies and all other component logic are otherwise unchanged from before
      this ticket
- [x] A repo-wide search confirms no remaining `XMLHttpRequest` usage in production code (`tests/`
      is out of scope for this check — its own dependency on the pattern was removed in ticket 01)
- [x] The three page entry scripts (`builder.js`, `battle.js`, `battles.js`) require no changes
- [x] Stale code comments explaining the old sync-XHR-vs-test-harness rationale are removed from
      every converted file
- [x] `npm run test:e2e` (ticket 01's suite) passes against the converted components — with one
      test-only stabilization (see Comments below); every production file listed above is otherwise
      unmodified
- [x] Manual check: `index.html`, `battle.html`, `battles.html` served locally (`python3 -m
      http.server`) load with no console errors and remain fully interactive — the main behavioral
      risk, since the 3 page-root components are now async roots passed to `Vue.createApp` for the
      first time

## Comments

Converting all 13 components to non-blocking `fetch()` makes the page interactive noticeably
sooner than the old blocking sync-XHR mount did. That exposed a latent, unrelated timing bug in
`tests/e2e/battle-tactical.spec.js`'s "destroying a ship does not shift the card header or system
list" test: `battle.html`'s dice `.chip` uses Google Fonts' IBM Plex Mono with `display: swap`,
and `.chip`'s `line-height: normal` differs between the fallback font and the loaded webfont (27px
vs 34px, confirmed with a throwaway debug script). The old sync-XHR page load was slow enough that
the font always finished loading before any test could interact with the page, accidentally
masking this. The faster async page doesn't give that same guarantee, so the test's fast, back-to-
back checkbox clicks could land before the font swap landed.

This is a pre-existing CSS/font-swap race, not a bug in the conversion, and fixing it properly
(e.g. a fixed `line-height` on `.chip`, or preloading the font) is a CSS/visual change - out of
scope for this ticket and the parent spec. Asked the user how to proceed; chose to stabilize the
test only: `seedBattle()` in `battle-tactical.spec.js` now awaits `document.fonts.ready` right
after navigation, before any test takes its first layout measurement. No production file changed
for this. Filing the underlying font-swap race as a separate follow-up is still open - not created
as a ticket here since the user only asked for the test stabilization in this session.
