# 09: Migrate battle tracker to Vue

**What to build:** Rewrite the battle tracker page (`battle.html` / `battle.js`) from Mithril to Vue 3,
reusing `support.js` and the Vue shared nav/footer components from #07. Per-system damage tracking,
ship/company destruction, fuel state, and ship capture/transfer between fleets keep working identically,
and the `localStorage['mf0-battles']` compressed format is unchanged. Merges to `main` independently once
verified.

**Blocked by:** 07 (Vue shared components), 04 (Battle tracker characterization tests)

**Status:** ready-for-agent

- [ ] Battle tracker page fully rewritten in Vue 3; Mithril removed from this page only
- [ ] Each component authored as a separate template file + logic file, Composition API with explicit
      `setup()`
- [ ] Page uses the Vue shared nav-link/footer components from #07
- [ ] The battle tracker characterization suite (#04) passes unmodified against the rewrite
- [ ] `localStorage['mf0-battles']` schema/compressed format unchanged
- [ ] Per-system damage, ship/company destruction, fuel state, and capture/transfer all verified working
- [ ] Merged to `main` independently of the other two pages' migrations
