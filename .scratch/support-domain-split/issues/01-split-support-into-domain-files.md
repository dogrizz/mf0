# 01: Split support.js into support/{common,storage,builder,battle}.js

**What to build:** Replace `support.js` with `support/common.js`, `support/storage.js`,
`support/builder.js`, and `support/battle.js`, per `docs/adr/0001-split-support-js-by-domain.md`.
Update `index.html`, `battle.html`, `battles.html` to load only the files each page needs, and
update `tests/helpers/load-support.js` to load all of them in dependency order. As part of the
same pass:

- Split `dice(ship)` into a builder-domain preview version (hardcoded `2W` baseline) and a
  battle-domain live version (counts real non-disabled internal systems), sharing a private
  attack/defense/sensor/catapult scoring helper in `common.js`.
- Move `readBattle` and its migration helpers (`alreadyAddedInternals`, `hasInternals`,
  `alreadySetUpCompanies`, `buildCompanyData`) into `support/battle.js`; `readBattle` calls
  `support/storage.js` for the raw read/write only.
- Replace the six manual `store(props.battle)` calls (in `vue-battle-player.js`,
  `vue-battle-company.js`, `vue-battle-ship.js`) with a single `watch(() => state.battle, () =>
  store(state.battle), { deep: true })` set up once in `battle.js`.

No behavior change from a player's perspective — this is a pure code-organization + one
mechanical persistence-pattern change.

**Blocked by:** none

**Status:** done

- [x] `support.js` replaced by `support/common.js` (constants + shared dice-scoring helper),
      `support/storage.js` (domain-blind: `store`, `storeBattle`, `readBattles`, `forfeitBattle`,
      `hash`), `support/builder.js`, `support/battle.js`
- [x] `storage.js` contains no reference to `ShipSystem`/`MechSystem` or any battle-shaped concept
- [x] `builder.js` and `battle.js` contain no calls into each other
- [x] No `support/battles.js` created — `battles.js` (the page) calls `support/storage.js` directly
- [x] `dice()` split into builder/battle versions sharing a private scoring helper; no function
      left inferring its caller's domain from data shape
- [x] `readBattle` + migration helpers live in `support/battle.js`
- [x] The six manual `store(props.battle)` calls replaced by one `watch` in `battle.js`
- [x] `index.html` / `battle.html` / `battles.html` each load only the `support/*.js` files that
      page needs
- [x] `tests/helpers/load-support.js` updated to load all `support/*.js` files in dependency order
- [x] Full existing test suite (`npx vitest run`) passes unmodified
- [ ] Manual smoke pass: build a fleet, fight, verify dice notation matches pre-change output in
      both the Fleet Builder and the Battle Tracker, verify battle state still persists across a
      page reload — **not performed** (PR relied on the DOM-driven characterization suite instead;
      left unchecked rather than falsely marked done)

## Comments

Merged as PR #20. `dice(ship)` (which silently branched on `hasInternals(ship)` to guess
builder-shaped vs. battle-shaped data) split into `builderDice` (fixed `2W` baseline) and
`battleDice` (counts real internal systems), sharing a private scoring helper in `common.js`. The
six manual `store(props.battle)` calls scattered across `vue-battle-player.js`/`vue-battle-ship.js`/
`vue-battle-company.js` collapsed into a single deep `Vue.watch` set up once in `battle.js`.
`storage.js` stays domain-blind; `readBattle` and its migration helpers moved into `battle.js`,
which calls `storage.js` only for the raw read/write.

`npx vitest run` (56/56) and `npx prettier --check` clean. `/code-review` (medium): one flagged
note (persistence now flushes on Vue's microtask scheduler rather than synchronously) addressed
with a clarifying comment in `battle.js`. Manual browser smoke pass was not performed in this
session — see the unchecked box above.
