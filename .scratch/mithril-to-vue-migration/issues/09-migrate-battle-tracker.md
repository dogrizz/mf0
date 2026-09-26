# 09: Migrate battle tracker to Vue

**What to build:** Rewrite the battle tracker page (`battle.html` / `battle.js`) from Mithril to Vue 3,
reusing `support.js` and the Vue shared nav/footer components from #07. Per-system damage tracking,
ship/company destruction, fuel state, and ship capture/transfer between fleets keep working identically,
and the `localStorage['mf0-battles']` compressed format is unchanged. Merges to `main` independently once
verified.

**Blocked by:** 07 (Vue shared components), 04 (Battle tracker characterization tests)

**Status:** resolved

- [x] Battle tracker page fully rewritten in Vue 3; Mithril removed from this page only
- [x] Each component authored as a separate template file + logic file, Composition API with explicit
      `setup()`
- [x] Page uses the Vue shared nav-link/footer components from #07
- [x] The battle tracker characterization suite (#04) passes unmodified against the rewrite
- [x] `localStorage['mf0-battles']` schema/compressed format unchanged
- [x] Per-system damage, ship/company destruction, fuel state, and capture/transfer all verified working
- [x] Merged to `main` independently of the other two pages' migrations

## Comments

Implemented as five new component pairs (logic `.js` + `.template.html`), all prefixed
`vue-battle-`: `player` (one scoreboard row), `ship` (a ship card - transfer button/popup, dice,
per-system damage checkboxes), `company` (a mech company card - fuel toggle, dice, per-system
damage checkboxes), `fleet` (one fleet's ships + companies), and `app` (the page root: nav link,
scoreboard, ship tracker, footer). `battle.js` is now just the entry point: reads `battleId` from
the URL, calls the unchanged `readBattle()` (still doing its lazy roster migration), wraps the
result in a `Vue.reactive` container, registers every component, and mounts. `battle.html` drops
Mithril and `common.js` for the Vue CDN global build plus one `<script src>` per new component
file, in the same "support.js first, entry script last" shape as ticket 08's `index.html`.
`support.js` itself is untouched.

Follows ticket 08's established pattern exactly: every new component loads its template via a
synchronous `XMLHttpRequest` against its own same-directory `.template.html` file (not
`fetch()`+`Vue.defineAsyncComponent`), since the characterization suite's `beforeEach` mounts the
page synchronously with no `await` before each test's first DOM query. `shared/vue-options-link.js`
and `shared/vue-app-footer.js` from #07 are reused unmodified.

`tests/helpers/load-battle-page.js` was rewritten to inline the Vue sources (mirroring
`load-builder-page.js`) instead of Mithril + `common.js`, reusing `tests/helpers/page.js`'s
`mountPage()`/`xhrRoot` infrastructure ticket 08 already built - no further test-harness changes
were needed. `tests/battle.test.js` itself required zero changes and passes unmodified (6/6).

Verified against the full offline characterization suite (`npx vitest run`, 52/52 passing) and a
`python3 -m http.server` smoke pass confirming every script/template asset the page references
(support.js, the two shared components, all five battle components, battle.js itself) resolves
over HTTP with no 404s. No headless/real-browser click-through was available in this session's
environment (no browser tool), so this smoke pass is somewhat weaker than ticket 08's - the jsdom
characterization suite is the primary source of confidence here.
