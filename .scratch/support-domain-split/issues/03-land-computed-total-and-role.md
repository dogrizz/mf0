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

**Status:** ready

- [ ] `support/battle.js` no longer defines `recalculate`/`determineRole`; all four former call
      sites removed
- [ ] `battle.js` (page entry) attaches `total`/`role` as `computed` once per player, after the
      roster is inside the reactive tree
- [ ] `vue-battle-player.js`'s mount-time `recalculate` call removed
- [ ] `tests/helpers/load-support.js` no longer exports `recalculate`/`determineRole`
- [ ] `tests/support.test.js`'s "recalculate / determineRole" describe block replaced by
      `tests/battle.test.js` assertions on `total`/`role` reflecting HVA/TAS/system-damage changes
- [ ] Full test suite (`npx vitest run`) passes
- [ ] Manual smoke pass: HVA/TAS edits, system damage, mech company fuel toggling, and ship transfer
      all update `total`/`role` correctly in the running battle tracker

## Comments
