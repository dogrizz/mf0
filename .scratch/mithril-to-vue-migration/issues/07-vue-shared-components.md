# 07: Vue shared components (temporary duplicate)

**What to build:** Load Vue 3 via its CDN "global build" (no bundler, no compiler needed at runtime) and
author a Vue version of the shared nav-link and footer components — today Mithril's `OptionsComponent` and
`FooterComponent` in `common.js` — as separate template and logic files, using the Composition API with an
explicit `setup()` function. This coexists with the existing Mithril `common.js` until the last page
migrates (#10), so unmigrated pages keep working unaffected.

**Blocked by:** 06 (CSS review & cleanup pass)

**Status:** resolved

- [x] Vue 3 loaded via its CDN global build; no bundler or compile step introduced anywhere in the
      deployed site
- [x] Vue equivalents of `OptionsComponent` (nav link to saved battles) and `FooterComponent` (support
      links) exist, each as a separate template file + logic file
- [x] Each Vue component uses the Composition API with an explicit `setup()` function (not `<script
      setup>`)
- [x] Existing Mithril `common.js` is untouched and still used by all three (not-yet-migrated) pages
- [x] No page's runtime behavior changes as part of this ticket — the new module has no consumer yet

## Comments

Implemented as `vue-options-link.js`/`vue-options-link.template.html` and
`vue-app-footer.js`/`vue-app-footer.template.html` at the repo root, alongside the existing flat file
layout. Each logic file captures its own `document.currentScript.src` synchronously (classic script,
no module system), then registers the component via `Vue.defineAsyncComponent`, fetching its sibling
template file at runtime — matching the spec's "fetched and registered at runtime" decision. Components
are exposed as globals via `var` (not `const`), matching `common.js`'s pattern, since `const`/`let`
declarations at classic-script top level don't attach to `window` the way `var` and function
declarations do — this was caught by manually loading both components against the real Vue 3 CDN
global build in a jsdom harness and finding `Vue warn: Failed to resolve component`.

No new automated tests were added for these components: the spec's Testing Decisions section commits
to two seams (domain logic unit tests, and page-level DOM tests) and explicitly defers
component-level test granularity to a follow-up after the migration completes. Since this module has no
page consumer yet, neither existing seam applies. Instead, correctness was verified by loading the real
Vue 3 CDN global build together with both new files in a jsdom harness (fetch polyfilled, since jsdom
doesn't implement it) and confirming the rendered markup is DOM-equivalent to the current Mithril
`OptionsComponent`/`FooterComponent` output (including the hidden-battle-link case rendering nothing).
The full existing test suite (52 tests) still passes unmodified.

**Known caveat for tickets 08–10:** the fetch-based template loading (per this spec's "fetched and
registered at runtime" decision) requires the consuming page to be served over http(s) — Chrome and
Firefox block `fetch()` against `file://` URLs. Once a page adopts these components, local dev needs a
static file server (e.g. `python3 -m http.server`, already documented as an option in the root
CLAUDE.md) rather than opening the `.html` file directly. Documented as a comment in both new logic
files; harmless today since neither component has a consumer yet.
