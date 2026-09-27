# 10: Migrate battles list to Vue + retire Mithril shared components

**What to build:** Rewrite the battles list page (`battles.html` / `battles.js`) from Mithril to Vue 3,
using the Vue shared nav/footer components from #07 — the last page migration. Since no page depends on
the Mithril copy of the shared components afterward, retire it: delete the Mithril `OptionsComponent`/
`FooterComponent` and the Mithril library reference from every page, leaving a single Vue shared component
module and no Mithril anywhere in the project.

**Blocked by:** 07 (Vue shared components), 05 (Battles list characterization tests), 08 (Migrate fleet
builder to Vue), 09 (Migrate battle tracker to Vue)

**Status:** done

- [x] Battles list page fully rewritten in Vue 3, using separate template + logic files, Composition API
      with explicit `setup()`
- [x] The battles list characterization suite (#05) passes unmodified against the rewrite
- [x] Listing, resume, and forfeit/delete behavior against `localStorage['mf0-battles']` unchanged
- [x] Temporary Mithril version of the shared nav-link/footer components removed; a single Vue shared
      component module remains
- [x] Mithril library `<script>` reference removed from all three HTML pages — no page loads Mithril
      anymore
- [x] Merged to `main`

## Comments

Merged as PR #18, the last ticket of the migration. Rewrote `battles.html`/`battles.js` as a Vue 3
component (`battles/vue-battles-app.js` + template) reusing the shared nav-link/footer components
from ticket 07. Retired Mithril entirely: deleted the Mithril `OptionsComponent`/`FooterComponent`,
removed the Mithril CDN `<script>`, dropped the `mithril` devDependency, and updated `shared/vue-*`
comments that referenced the temporary coexistence. Moved the forfeit/delete mutation into
`support.js` as `forfeitBattle()`, matching ticket 09b's (PR #17) convention of keeping non-Vue
mutation logic out of components' `setup()`. Updated CLAUDE.md's architecture section.

`npx vitest run` (52/52, including the ticket-05 characterization suite unmodified) and
`npx prettier --check` both clean.
