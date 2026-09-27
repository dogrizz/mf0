# 02: Spike — total/role as Vue computed instead of imperative recalculate

**What to build:** A throwaway prototype (not merged as-is) answering: can `player.total` and
`player.role` become Vue `computed` properties, derived from `ppa`/`hva`/`tas` across the roster,
instead of the current imperative `recalculate(player, players)` / `determineRole(players)` calls
scattered across battle mutations (`changePlayerHva`, `changePlayerTas`, `applySystemDamage`,
`toggleCompanyFuel`, plus the one-time call on `vue-battle-player.js` mount)?

If yes, this removes a whole category of "did every mutation remember to call recalculate" bugs —
but `total`/`role` are currently persisted as plain fields in the stored battle JSON, so going
computed means `readBattle` stops expecting them and they get recomputed on load instead. That's
a real (if small) change to what gets serialized, which is why this is a spike before a decision,
not a decision made on paper.

**Blocked by:** 01 (touches the same battle-domain mutation functions; land after the split so the
diff isn't compounded)

**Status:** done

- [x] Prototype demonstrates `total`/`role` as `computed`, correctly reactive across HVA/TAS/PPA
      changes and system-damage-driven TAS changes, matching current `recalculate`/`determineRole`
      output exactly for the same inputs
- [x] Prototype demonstrates (or rules out) not persisting `total`/`role` in the stored battle JSON
      and recomputing them on `readBattle`
- [x] Decision recorded (in this ticket's Comments, or a new ADR if it turns out to be genuinely
      hard-to-reverse/surprising) on whether to land this for real, and if so, whether it needs a
      migration step for already-stored battles that have `total`/`role` baked into their JSON

## Comments

Prototype: `.scratch/support-domain-split/issues/02-spike-computed-total-role.mjs` (throwaway, run
directly with `node` — not wired into the app or the `tests/` regression suite; delete after this
decision is acted on). Uses the real `vue` package directly (`reactive`/`computed`, no DOM needed).

**Findings:**

- Attaching `player.total = computed(() => player.ppa * (player.hva + player.tas))` and
  `player.role = computed(() => ...)` (same Defender/Primary/Secondary-attacker logic as
  `determineRole`, one computed per player) to an **already-reactive** roster reproduces
  `recalculate`/`determineRole`'s output exactly, including the tied-for-both-max-and-min edge case
  (resolves to Primary attacker) — verified against the same fixtures as
  `tests/support.test.js`'s "recalculate / determineRole" describe block.
- It stays correctly reactive across HVA/TAS changes and system-damage-driven TAS changes (mutating
  `player.hva`/`fleet.tas` directly, the way `changePlayerHva`/`applySystemDamage`/
  `toggleCompanyFuel` do today) with **zero** imperative `recalculate`/`determineRole` calls anywhere.
  This removes a real, currently-live bug: `vue-battle-ship.js`'s `transferShip` mutates
  `fromFleet.tas`/`toFleet.tas` but never calls `recalculate` afterward, so a ship transfer silently
  leaves both fleets' `total`/`role` stale today — computed properties fix this for free, since
  there's no call site left to forget.
- Persistence turned out not to be a concern: `storage.js`'s `store()`/`storeBattle()` calls
  `JSON.stringify` on the *reactive* battle object handed to it by `battle.js`'s deep `watch`, and
  `JSON.stringify` walks the reactive Proxy (not `toRaw()`), so `[[Get]]` on `total`/`role` triggers
  Vue's ref-auto-unwrap-in-reactive-objects behavior and serializes the current computed *value* —
  never the `ComputedRefImpl`'s internal fields. The persisted JSON shape is unchanged, so
  **`readBattle` does not need to stop expecting `total`/`role`, and no migration step is needed**
  for already-stored battles.
- Real constraint found: this can't be dropped into `readBattle()` as a drop-in replacement for the
  `recalculate()` call in `vue-battle-player.js`'s mount hook, because `readBattle()` returns a
  plain (non-reactive) object. A `computed`'s getter tracks dependencies by reading them through a
  reactive Proxy's `get` trap; reading a plain object's properties triggers no such trap, so a
  `computed` attached to a plain host never tracks anything and just caches its first-computed value
  forever, independent of any later mutation (confirmed directly against `.value`, not just the
  unwrapped property, in the prototype's negative-control check — comparing the property itself
  would trivially pass by object-reference identity either way, since nothing reassigns it). The
  attach step has to run once the roster is inside Vue's reactive tree, i.e. in `battle.js`'s page
  entry right after `battleState.battle = readBattle(...)`, the same place the existing single deep
  `watch()` already lives — not inside `support/battle.js`'s `readBattle`.

**Decision:** land it for real. No migration step needed (persistence is unaffected, per above).
Filed as ticket 03 (`.scratch/support-domain-split/issues/03-land-computed-total-and-role.md`):
attach `total`/`role` as `computed` once in `battle.js`'s page entry, delete `recalculate`/
`determineRole` and their four call sites in `support/battle.js` plus the mount-time call in
`vue-battle-player.js`, and drop `recalculate`/`determineRole` from
`tests/helpers/load-support.js`'s exports (replaced by DOM-level assertions in
`tests/battle.test.js` against `total`/`role` after each mutation, since they're no longer
free-standing functions to unit test directly).
