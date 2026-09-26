# 02: Domain logic unit tests (support.js)

**What to build:** Unit tests calling `support.js`'s exported functions directly with plain JS objects,
asserting on return values and, for the persistence functions, on resulting `localStorage` contents. No
DOM required. These protect the core game-scoring/persistence logic independent of any UI framework.

**Blocked by:** 01 (Add dev-only test tooling)

**Status:** ready-for-agent

- [ ] `calculatePPA(players, syncShips)` covered across representative fleets, including the tie-breaking
      behavior at the TA/system-count extremes
- [ ] `dice(ship)` and `companyDice(company)` covered for representative system configurations, including
      disabled systems being excluded from the notation
- [ ] `recalculate(player, players)` and `determineRole(players)` covered across relative `total` values,
      confirming correct Defender / Primary attacker / Secondary attacker assignment
- [ ] `storeBattle`/`readBattle`/`readBattles`/`store` covered, including the lazy migration path on read
      (backfilling ship `internal` systems and mech `companies`) for old saved data
- [ ] Suite runs via the single command from #01 and passes against the current, unmodified codebase
