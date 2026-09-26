# 08: Migrate fleet builder to Vue

**What to build:** Rewrite the fleet builder page (`index.html` / `builder.js`) from Mithril to Vue 3,
reusing the unchanged `support.js` domain logic and the Vue shared nav/footer components from #07. All
existing player-facing behavior (ships, systems, mech companies, catapults, live PPA calculation) and the
`localStorage['mf0-tools']` format are preserved exactly. This page migrates first since it's the highest
complexity and most likely place for pattern problems to surface. Merges to `main` independently once
verified.

**Blocked by:** 07 (Vue shared components), 03 (Fleet builder characterization tests)

**Status:** resolved

- [x] Fleet builder page fully rewritten in Vue 3 (CDN global build); Mithril removed from this page only
      (battle tracker and battles list still run Mithril)
- [x] Each component authored as a separate template file + logic file, Composition API with explicit
      `setup()`
- [x] Page uses the Vue shared nav-link/footer components from #07
- [x] The fleet-builder characterization suite (#03) passes unmodified against the rewrite
- [x] `localStorage['mf0-tools']` schema/format unchanged
- [x] Cross-component interactions verified working: catapult enabling mech company, ship class affecting
      available systems, live PPA recalculation
- [x] Merged to `main` independently of the other two pages' migrations

## Comments

Implemented as seven new component pairs (logic `.js` + `.template.html`), all prefixed
`vue-builder-`: `system` (a system slot's class/attack-type dropdowns), `mech-companies` (the ace
selection block), `ship` (a ship card), `fleet` (one player's fleet-builder block), `ship-tracker`
(the accordion body: sync checkbox + all fleets), `player` (one scoreboard row), and `app` (the
page root: nav link, scoreboard, Fight!, accordion, footer). `builder.js` is now just the entry
point: it holds a `Vue.reactive` state object (`players`/`track`/`sync`), the `saveState`/
`recalculatePPA` globals every component calls (mirroring the old module-scope closures, now
necessarily real globals since each component is its own classic script), and registers +
mounts everything. `index.html` drops Mithril and `common.js` for the Vue CDN global build plus
one `<script src>` per new component file, in the same "support.js first, entry script last"
shape as before. `support.js` itself is untouched.

**Template-loading mechanism diverges from #07 for this page's own components, and this is
deliberate.** #07's two shared components use `fetch()` + `Vue.defineAsyncComponent` (async: the
component renders nothing until its template promise resolves). The fleet-builder
characterization suite's `beforeEach` is synchronous and its first assertion in every test is a
DOM query with zero preceding `await` - matching the previous Mithril page's fully synchronous
initial render. An async root (or an async ancestor of whatever that first query touches) would
render nothing yet at that point, since resolving even a promise that's already fulfilled still
takes a microtask longer than the synchronous `mount()` call. So every one of this ticket's seven
new components loads its template with a synchronous `XMLHttpRequest` against its own
same-directory `.template.html` file instead, making them ordinary (non-async) Vue components -
available synchronously, exactly like the Mithril version was. `options-link`/`app-footer` from
#07 stay as they are (not modified beyond one fallback described below); since they're rendered as
siblings of, not ancestors of, anything the suite queries before its first `redraw()`, their being
async doesn't affect any assertion.

**Test harness changes (`tests/helpers/`), not the frozen suite:**
- `load-builder-page.js` now inlines the Vue global build (vendored as a new `vue` devDependency,
  same pattern as the existing `mithril` devDependency) plus all nine new/changed component
  sources instead of Mithril + `common.js`.
- `page.js`'s shared `inlineScript()` helper only escaped literal `</script>`. Vue's dev build
  also contains a literal `<!--` (inside an unrelated warning string, `"Unexpected '<!--' in
  comment."`), which flips the HTML tokenizer into "script data escaped state" - under which a
  later `</script>` only closes the tag once balanced against every `<script`-like substring seen
  since, so without escaping it, parsing of an inlined Vue source swallows every subsequent inlined
  `<script>` tag on the page into one blob that then fails to parse as JS. Now escaped the same way
  as `</script>`. This fix is generic (any page inlining Vue's dev build would hit it), so it lives
  in the shared helper, not something builder-page-specific.
- `mountPage()` gained an opt-in `xhrRoot` option: when set, a `beforeParse` hook (runs before any
  inline script, so it's in place for a component's very first synchronous top-level statement)
  replaces `window.XMLHttpRequest` with a stand-in that reads the requested same-directory file
  straight off disk rather than doing real networking, and also polyfills `window.fetch`
  the same way (jsdom implements neither `fetch` nor synchronous file-backed XHR responses, in or
  out of a test harness - confirmed by reproducing the identical `ReferenceError: fetch is not
  defined` against a real `python3 -m http.server` instance with the genuine Vue CDN build, no
  inlining involved). `mountBuilderPage()` passes `xhrRoot: ROOT` and otherwise leaves `url` at
  the existing `http://localhost/` default; a `file://` document origin was tried first but jsdom
  refuses `localStorage` access for that "opaque" origin, which this suite's
  `readToolsState()` assertions depend on.
- `vue-options-link.js`/`vue-app-footer.js` each gained one fallback: `document.currentScript.src
  || location.href`. An inlined `<script>` (as this test harness uses, to keep `mountBuilderPage()`
  synchronous - see above) always has an empty `currentScript.src`, which `new URL(relative, '')`
  rejects as an invalid base; production is unaffected since it always loads these two files via a
  real `<script src>`, where `currentScript.src` is never empty.

Verified against both the offline characterization suite (`npx vitest run`, 52/52 passing, zero
unhandled rejections) and a real end-to-end smoke pass: `python3 -m http.server` serving this
branch's actual files, the genuine Vue 3 CDN build (no vendored/offline substitution), jsdom
driving real DOM events against it end to end - add player, add ship, dice notation, set a system
to catapult (mech company + ace UI appears), and `localStorage['mf0-tools']` content, all matching
expectations, no console errors.
