// Throwaway prototype for ticket 02 (.scratch/support-domain-split/issues/02-spike-computed-total-and-role.md).
// Not wired into the app or the tests/ regression suite - run directly with `node` to check the
// three checklist items, then delete regardless of which way the decision goes (see the ticket's
// Comments for the recorded decision). Uses the real `vue` package (already a devDependency),
// no jsdom/browser needed since reactive()/computed() don't touch the DOM.

import assert from 'node:assert/strict'
import { reactive, computed } from 'vue'

// Mirrors support/battle.js's recalculate()/determineRole(), but as computed properties attached
// once per player instead of imperative calls scattered across every mutation. Must be called with
// an already-reactive roster (e.g. one obtained from inside a Vue.reactive(battle) tree) - if
// `roster` were a plain array, closures below would read raw, untracked values and never update.
function attachComputedTotalAndRole(roster) {
  roster.forEach((player) => {
    player.total = computed(() => player.ppa * (player.hva + player.tas))
  })
  roster.forEach((player) => {
    player.role = computed(() => {
      const sorted = [...roster].sort((a, b) => b.total - a.total)
      let role = ''
      if (player.total === sorted[0].total) role = 'Defender'
      if (player.total === sorted[roster.length - 1].total) role = 'Primary attacker'
      if (role === '') role = 'Secondary attacker'
      return role
    })
  })
}

function player(overrides = {}) {
  return { name: 'Player', hva: 0, tas: 0, systems: 0, ships: [], ...overrides }
}

function roleByName(roster) {
  return Object.fromEntries(roster.map((p) => [p.name, p.role]))
}

// --- Checklist item 1: matches recalculate()/determineRole() output for the same inputs -------
// Same fixtures as tests/support.test.js's "recalculate / determineRole" describe block.

{
  const roster = reactive([
    player({ name: 'a', ppa: 5, hva: 1, tas: 1 }),
    player({ name: 'b', ppa: 5, hva: 3, tas: 3 }),
    player({ name: 'c', ppa: 5, hva: 5, tas: 5 }),
  ])
  attachComputedTotalAndRole(roster)
  const roles = roleByName(roster)
  assert.equal(roles.c, 'Defender')
  assert.equal(roles.b, 'Secondary attacker')
  assert.equal(roles.a, 'Primary attacker')
  console.log('[pass] Defender/Primary/Secondary assignment matches determineRole()')
}

{
  const roster = reactive([player({ name: 'a', ppa: 5, hva: 2, tas: 2 }), player({ name: 'b', ppa: 5, hva: 2, tas: 2 })])
  attachComputedTotalAndRole(roster)
  assert.ok(roster.every((p) => p.role === 'Primary attacker'))
  console.log('[pass] total tied for both max and min resolves to Primary attacker (matches determineRole())')
}

{
  const roster = reactive([player({ ppa: 4, hva: 3, tas: 2 })])
  attachComputedTotalAndRole(roster)
  assert.equal(roster[0].total, 20)
  console.log('[pass] total === ppa * (hva + tas), matches recalculate()')
}

// --- Checklist item 1 (continued): reactive across HVA/TAS/PPA changes and system-damage-driven
// TAS changes, with NO imperative recalculate()/determineRole() call anywhere below -------------

{
  const roster = reactive([
    player({ name: 'a', ppa: 5, hva: 1, tas: 1 }),
    player({ name: 'b', ppa: 5, hva: 3, tas: 3 }),
    player({ name: 'c', ppa: 5, hva: 5, tas: 5 }),
  ])
  attachComputedTotalAndRole(roster)

  // changePlayerHva-equivalent
  roster[0].hva = 10
  assert.equal(roster[0].total, 55) // 5 * (10 + 1)
  assert.equal(roleByName(roster).a, 'Defender')
  assert.equal(roleByName(roster).c, 'Secondary attacker')

  // applySystemDamage-equivalent: a ship destruction decrements the fleet's tas directly
  roster[2].tas -= 1
  assert.equal(roster[2].total, 45) // 5 * (5 + 4)

  // toggleCompanyFuel-equivalent: reviving/incrementing tas back
  roster[2].tas += 1
  assert.equal(roster[2].total, 50)

  console.log('[pass] total/role stay correct across hva/tas mutations with zero recalculate()/determineRole() calls')
}

// --- Checklist item 2: what happens to persistence (JSON.stringify, matching storage.js's
// store()/storeBattle(), which does JSON.stringify({ roster, track, sync }) on the *reactive*
// battle object handed to it by battle.js's deep watch) -----------------------------------------

{
  const roster = reactive([player({ name: 'a', ppa: 5, hva: 1, tas: 1 }), player({ name: 'b', ppa: 5, hva: 5, tas: 5 })])
  attachComputedTotalAndRole(roster)

  // JSON.stringify walks the reactive Proxy (not toRaw()), so [[Get]] on `total`/`role` goes
  // through Vue's ref-auto-unwrap-in-reactive-objects behavior and serializes the *current
  // computed value* - not the ComputedRefImpl's internal fields (_value/dep/effect/...).
  const serialized = JSON.parse(JSON.stringify({ roster: roster, track: true, sync: false }))
  assert.equal(typeof serialized.roster[0].total, 'number')
  assert.equal(typeof serialized.roster[1].role, 'string')
  assert.equal(serialized.roster[0].total, 5 * (1 + 1))
  assert.equal(serialized.roster[1].role, 'Defender')
  console.log(
    '[pass] JSON.stringify(reactiveBattle) already serializes total/role as plain values - readBattle does NOT need to change to avoid persisting junk',
  )
}

// --- Negative control: attaching the computed props to a PLAIN (non-reactive) array, the shape
// readBattle() returns today, silently fails to update - confirming this can't just be dropped
// into readBattle() as a drop-in replacement for the recalculate() call currently at the top of
// vue-battle-player.js's setup(). It has to run after the battle is inside the reactive tree
// (i.e. in battle.js's page entry, right after `battleState.battle = readBattle(...)`, mirroring
// where the single deep watch() already lives) - not inside readBattle() itself.
//
// Asserting on `.value` directly (not just `plainRoster[0].total`, which - since nothing here is
// reactive - is the exact same ComputedRefImpl reference before and after regardless of whether
// the computed itself updates) to make the actual mechanism unambiguous: the getter reads
// `player.hva` as a plain property access, so no reactive dependency ever gets tracked, so the
// computed never has a reason to invalidate its cache - it computes once and then returns that
// same stale value forever, independent of any auto-unwrap concern. -----------------------------

{
  const plainRoster = [player({ name: 'a', ppa: 5, hva: 1, tas: 1 })]
  attachComputedTotalAndRole(plainRoster)
  const before = plainRoster[0].total.value
  plainRoster[0].hva = 100
  assert.equal(plainRoster[0].total.value, before) // still stale - no dependency was ever tracked
  console.log(
    '[confirmed] a computed over a plain (pre-reactive) object never tracks its dependencies, so it never invalidates - must attach after reactive() wrapping, not inside readBattle()',
  )
}

console.log('\nAll checks passed.')
