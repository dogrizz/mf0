# 02: Domain logic unit tests (support.js)

**What to build:** Unit tests calling `support.js`'s exported functions directly with plain JS objects,
asserting on return values and, for the persistence functions, on resulting `localStorage` contents. No
DOM required. These protect the core game-scoring/persistence logic independent of any UI framework.

**Blocked by:** 01 (Add dev-only test tooling)

**Status:** resolved

- [x] `calculatePPA(players, syncShips)` covered across representative fleets, including the tie-breaking
      behavior at the TA/system-count extremes
- [x] `dice(ship)` and `companyDice(company)` covered for representative system configurations, including
      disabled systems being excluded from the notation
- [x] `recalculate(player, players)` and `determineRole(players)` covered across relative `total` values,
      confirming correct Defender / Primary attacker / Secondary attacker assignment
- [x] `storeBattle`/`readBattle`/`readBattles`/`store` covered, including the lazy migration path on read
      (backfilling ship `internal` systems and mech `companies`) for old saved data
- [x] Suite runs via the single command from #01 and passes against the current, unmodified codebase

## Comments

Implemented `tests/support.test.js` (34 tests) plus `tests/helpers/load-support.js`, a loader that
indirect-evals `lz-string.min.js` then `support.js` (both classic, export-less scripts) into the jsdom
global scope so their function declarations are reachable as plain imports, matching how every page
already loads them via `<script>` tags. `support.js` itself is unchanged.

One genuine code-level quirk got characterized as current behavior rather than "fixed" (out of scope for
this migration, per the spec's Testing Decisions): `readBattle()` throws (rather than returning `null`)
when no battle has ever been stored, since it calls `.hasOwnProperty` on the `null` that `readBattles()`
returns for that case — vs. a clean `null` when battles exist but the requested id doesn't.

Two other covered behaviors looked quirky at first but are intended, not bugs:

- `dice()`'s `2W` fallback only applies when a ship has _no_ `internal` systems at all, not when they're
  all disabled. This isn't a leftover — the fleet builder never adds `internal`-class systems (only
  attack/defense/sensor/catapult are player-selectable there), so every builder-phase ship takes this
  branch and gets `2W` as its default wound capacity. `readBattle()`'s migration is what adds real,
  damage-trackable `internal` systems once a battle starts; only then does the active-count branch (and
  its "all disabled → no W token" behavior) come into play.
- `determineRole()` checks "is this the max total" and "is this the min total" unconditionally (not
  `else if`), so a total tied for both (e.g. all players tied) resolves to `Primary attacker`, not
  `Defender` — intended per the game rules.

All 35 tests pass (34 new + the existing smoke test) via `npm test`; `npx prettier --check tests/` is clean.
