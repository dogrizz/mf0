# 08: Migrate fleet builder to Vue

**What to build:** Rewrite the fleet builder page (`index.html` / `builder.js`) from Mithril to Vue 3,
reusing the unchanged `support.js` domain logic and the Vue shared nav/footer components from #07. All
existing player-facing behavior (ships, systems, mech companies, catapults, live PPA calculation) and the
`localStorage['mf0-tools']` format are preserved exactly. This page migrates first since it's the highest
complexity and most likely place for pattern problems to surface. Merges to `main` independently once
verified.

**Blocked by:** 07 (Vue shared components), 03 (Fleet builder characterization tests)

**Status:** ready-for-agent

- [ ] Fleet builder page fully rewritten in Vue 3 (CDN global build); Mithril removed from this page only
      (battle tracker and battles list still run Mithril)
- [ ] Each component authored as a separate template file + logic file, Composition API with explicit
      `setup()`
- [ ] Page uses the Vue shared nav-link/footer components from #07
- [ ] The fleet-builder characterization suite (#03) passes unmodified against the rewrite
- [ ] `localStorage['mf0-tools']` schema/format unchanged
- [ ] Cross-component interactions verified working: catapult enabling mech company, ship class affecting
      available systems, live PPA recalculation
- [ ] Merged to `main` independently of the other two pages' migrations
