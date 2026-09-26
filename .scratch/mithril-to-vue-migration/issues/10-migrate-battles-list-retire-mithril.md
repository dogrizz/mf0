# 10: Migrate battles list to Vue + retire Mithril shared components

**What to build:** Rewrite the battles list page (`battles.html` / `battles.js`) from Mithril to Vue 3,
using the Vue shared nav/footer components from #07 — the last page migration. Since no page depends on
the Mithril copy of the shared components afterward, retire it: delete the Mithril `OptionsComponent`/
`FooterComponent` and the Mithril library reference from every page, leaving a single Vue shared component
module and no Mithril anywhere in the project.

**Blocked by:** 07 (Vue shared components), 05 (Battles list characterization tests), 08 (Migrate fleet
builder to Vue), 09 (Migrate battle tracker to Vue)

**Status:** ready-for-agent

- [ ] Battles list page fully rewritten in Vue 3, using separate template + logic files, Composition API
      with explicit `setup()`
- [ ] The battles list characterization suite (#05) passes unmodified against the rewrite
- [ ] Listing, resume, and forfeit/delete behavior against `localStorage['mf0-battles']` unchanged
- [ ] Temporary Mithril version of the shared nav-link/footer components removed; a single Vue shared
      component module remains
- [ ] Mithril library `<script>` reference removed from all three HTML pages — no page loads Mithril
      anymore
- [ ] Merged to `main`
