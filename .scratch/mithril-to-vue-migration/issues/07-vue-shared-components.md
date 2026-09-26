# 07: Vue shared components (temporary duplicate)

**What to build:** Load Vue 3 via its CDN "global build" (no bundler, no compiler needed at runtime) and
author a Vue version of the shared nav-link and footer components — today Mithril's `OptionsComponent` and
`FooterComponent` in `common.js` — as separate template and logic files, using the Composition API with an
explicit `setup()` function. This coexists with the existing Mithril `common.js` until the last page
migrates (#10), so unmigrated pages keep working unaffected.

**Blocked by:** 06 (CSS review & cleanup pass)

**Status:** ready-for-agent

- [ ] Vue 3 loaded via its CDN global build; no bundler or compile step introduced anywhere in the
      deployed site
- [ ] Vue equivalents of `OptionsComponent` (nav link to saved battles) and `FooterComponent` (support
      links) exist, each as a separate template file + logic file
- [ ] Each Vue component uses the Composition API with an explicit `setup()` function (not `<script
      setup>`)
- [ ] Existing Mithril `common.js` is untouched and still used by all three (not-yet-migrated) pages
- [ ] No page's runtime behavior changes as part of this ticket — the new module has no consumer yet
