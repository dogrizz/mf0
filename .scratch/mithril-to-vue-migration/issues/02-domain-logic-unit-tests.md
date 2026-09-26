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

Added `tests/support.test.js` (43 assertions) plus a small loader (`tests/helpers/load-support.js`).
`support.js` is a plain classic script (no `export`s, global `function`/`const` declarations) loaded via a
`<script>` tag, so the loader reads `lz-string.min.js` + `support.js` and runs them through indirect
`eval` — the same way the browser loads them — then stashes the pieces tests need off a global object.
This required zero changes to `support.js` itself, keeping the domain logic module byte-for-byte
unchanged as scoped.

Two real quirks in current behavior got characterized (not fixed, per scope) rather than tested around:

- `dice(ship)` always renders `2W` for a ship with **no** `internal`-class systems at all, but switches to
  counting only *active* internal systems (which can be `0`, `1`, `3`, ..., not just the `2W` fallback)
  the moment any `internal` system is present — including rendering nothing at all when every internal
  system on the ship is disabled.
- `readBattle(id)` throws (`.hasOwnProperty` on `null`) rather than returning `null` when no battle has
  *ever* been stored, because `readBattles()` returns `null` (not `{}`) in that case. It only returns
  `null` cleanly when at least one battle exists but the requested id doesn't. Both paths are tested as
  they currently behave.

All 43 tests pass against the unmodified codebase via `npm test`.
