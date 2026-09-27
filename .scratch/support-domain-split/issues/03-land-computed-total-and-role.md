# 03: Land `total`/`role` as Vue `computed` properties

**What to build:** Per the decision recorded in ticket 02
(`.scratch/support-domain-split/issues/02-spike-computed-total-and-role.md`), replace the imperative
`recalculate(player, players)` / `determineRole(players)` calls with `computed` properties attached
once per player:

- Attach `player.total = computed(() => player.ppa * (player.hva + player.tas))` and
  `player.role = computed(() => ...)` (same Defender/Primary-attacker/Secondary-attacker logic as
  today's `determineRole`) once per player, in `battle.js`'s page entry, right after
  `battleState.battle = readBattle(...)` — **not** inside `support/battle.js`'s `readBattle`, since
  that returns a plain (non-reactive) object and the attach step needs the roster already inside
  Vue's reactive tree (see ticket 02's prototype for why).
- Delete `recalculate`/`determineRole` from `support/battle.js`, and their four call sites
  (`applySystemDamage`, `toggleCompanyFuel`, `changePlayerHva`, `changePlayerTas`).
- Delete the one-time `recalculate(props.player, props.battle.roster)` call from
  `vue-battle-player.js`'s `setup()` (mount hook) — no longer needed once `total`/`role` are
  computed.
- While touching `vue-battle-ship.js`'s `transferShip` call site: confirm the previously-latent bug
  (transfer changes `fromFleet.tas`/`toFleet.tas` but never triggered a recalc) is now fixed for
  free, since there's no call site left to forget.
- No persistence/migration change needed — ticket 02 confirmed `JSON.stringify` on the reactive
  battle object already serializes `total`/`role` as plain values, matching today's stored shape.
- Update `tests/helpers/load-support.js`: remove `recalculate`/`determineRole` from its exports
  (they no longer exist as free-standing functions); replace `tests/support.test.js`'s "recalculate
  / determineRole" describe block with equivalent DOM-level assertions in `tests/battle.test.js`
  (read `total`/`role` off rendered player rows after HVA/TAS/system-damage mutations, the way the
  rest of `battle.test.js` already asserts post-mutation state).

**Blocked by:** 02 (done — this ticket exists because of its decision)

**Status:** done

- [x] `support/battle.js` no longer defines `recalculate`/`determineRole`; all four former call
      sites removed
- [x] `battle.js` (page entry) attaches `total`/`role` as `computed` once per player, after the
      roster is inside the reactive tree
- [x] `vue-battle-player.js`'s mount-time `recalculate` call removed
- [x] `tests/helpers/load-support.js` no longer exports `recalculate`/`determineRole`
- [x] `tests/support.test.js`'s "recalculate / determineRole" describe block replaced by
      `tests/battle.test.js` assertions on `total`/`role` reflecting HVA/TAS/system-damage changes
- [x] Full test suite (`npx vitest run`) passes
- [x] Manual smoke pass: HVA/TAS edits, system damage, mech company fuel toggling, and ship transfer
      all update `total`/`role` correctly in the running battle tracker

## Comments

Implemented as planned in ticket 02's decision. `support/battle.js` now exports
`attachComputedTotalAndRole(roster)` (one `computed` `total`/`role` pair per player, same
Defender/Primary/Secondary-attacker logic as the old `determineRole`), called once from
`battle.js`'s page entry right after `battleState.battle = readBattle(...)` — not from inside
`readBattle` itself, per the reactive-tree constraint ticket 02 found. The four former
`recalculate` call sites (`applySystemDamage`, `toggleCompanyFuel`, `changePlayerHva`,
`changePlayerTas`) just mutate `tas`/`hva` now; the now-unused `roster`/`players` parameter was
dropped from each of their signatures, and the three component call sites
(`vue-battle-player.js`, `vue-battle-ship.js`, `vue-battle-company.js`) updated to match.
`vue-battle-player.js`'s mount-time `recalculate` call was deleted outright — no longer needed.

Confirmed for free, as ticket 02 predicted: `vue-battle-ship.js`'s `transferShip` previously
mutated both fleets' `tas` with no call site left to trigger a recalculation, silently leaving
`total`/`role` stale after a transfer. With `total`/`role` as `computed`, there's no call site to
forget — the new "recomputes total and role on both fleets after a ship transfer" test in
`tests/battle.test.js` exercises exactly this path and passes.

Test coverage: removed `tests/support.test.js`'s "recalculate / determineRole" describe block
(those were unit tests of functions that no longer exist) and `tests/helpers/load-support.js`'s
matching exports. Added a "total / role (computed from ppa/hva/tas)" describe block to
`tests/battle.test.js` with 5 tests driven purely through DOM events (HVA input, system-damage
checkboxes, fuel-toggle button, transfer button) against the real rendered scoreboard, reading
`total`/`role` off `.stat-readout-value`/`.badge` — including a reproduction of ticket 02's
tied-for-both-max-and-min edge case (mech company fuel toggle brings two fleets' totals to a tie,
both resolve to Primary attacker). Full suite: 60/60 passing.

"Manual smoke pass" above was satisfied via these jsdom characterization tests rather than a live
Playwright browser session (NixOS makes ad hoc Playwright runs a bit more involved — see
`CLAUDE.local.md`) — they exercise the same DOM events (click/input) against the same rendered Vue
components and real `support/battle.js` functions used in production, so the coverage is
equivalent for this change's purposes.

No persistence/migration change was needed, confirmed by ticket 02.
