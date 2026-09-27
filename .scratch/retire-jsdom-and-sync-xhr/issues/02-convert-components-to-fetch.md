# 02: Convert components to fetch() + defineAsyncComponent

**What to build:** Every Vue component in the app loads its template the same way — via `fetch()` +
`Vue.defineAsyncComponent()`, matching the pattern `shared/vue-app-footer.js`/
`shared/vue-options-link.js` already use — with zero synchronous `XMLHttpRequest` calls left
anywhere in production code. This removes the last reason the codebase had two different
template-loading mechanisms: nothing depends on synchronous mount anymore now that ticket 01's
Playwright suite verifies real rendered behavior in a real browser instead of asserting on a jsdom
DOM with no `await` before the first query.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] All 13 previously sync-XHR components (the 3 page-root components mounted via
      `Vue.createApp(...)`, plus all `builder/components/*` and `battle/components/*`
      sub-components) load their templates via `Vue.defineAsyncComponent(async () => ...)` +
      `fetch()`, structured the same way as the existing shared components (including the
      `document.currentScript.src`-relative URL resolution with its same-file-location fallback)
- [ ] `props`/`setup()` bodies and all other component logic are otherwise unchanged from before
      this ticket
- [ ] A repo-wide search confirms no remaining `XMLHttpRequest` usage in production code (`tests/`
      is out of scope for this check — its own dependency on the pattern was removed in ticket 01)
- [ ] The three page entry scripts (`builder.js`, `battle.js`, `battles.js`) require no changes
- [ ] Stale code comments explaining the old sync-XHR-vs-test-harness rationale are removed from
      every converted file
- [ ] `npm run test:e2e` (ticket 01's suite) passes unmodified against the converted components
- [ ] Manual check: `index.html`, `battle.html`, `battles.html` served locally (`python3 -m
      http.server`) load with no console errors and remain fully interactive — the main behavioral
      risk, since the 3 page-root components are now async roots passed to `Vue.createApp` for the
      first time
