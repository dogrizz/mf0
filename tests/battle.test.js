import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  click,
  companyElements,
  fleetElements,
  fleetName,
  fuelButton,
  hvaInput,
  isCaptured,
  isDead,
  mountBattlePage,
  playerCards,
  playerRole,
  playerTotal,
  readBattleState,
  redraw,
  setValue,
  shipElements,
  systemCheckbox,
  systemCheckboxes,
  transferButton,
} from './helpers/load-battle-page.js'

// Characterization tests for the battle tracker page (battle.html / battle.js), driven purely
// through DOM events (click) and asserted against the rendered DOM and the decompressed
// localStorage['mf0-battles'] contents - never against Mithril internals - so this suite keeps
// passing unmodified once the page is rewritten in Vue.
//
// The fixture roster is shaped the way the fleet builder hands one off: two fleets, each with one
// ship and no `internal` systems, ids, or mech companies yet - those are all added by readBattle()'s
// lazy migration when battle.js's `oninit` first reads this battle. Alpha's ship carries a catapult
// (so a mech company gets built for it); Beta's does not.
function makeRoster() {
  return [
    {
      name: 'Alpha',
      hva: 3,
      tas: 2,
      ppa: 5,
      ships: [
        {
          name: 'Alpha One',
          class: 'capital',
          systems: [{ class: 'attack', attackType: 'p' }, { class: 'catapult' }],
          destroyed: false,
        },
      ],
    },
    {
      name: 'Beta',
      hva: 3,
      tas: 1,
      ppa: 5,
      ships: [{ name: 'Beta One', class: 'frigate', systems: [{ class: 'defense' }], destroyed: false }],
    },
  ]
}

describe('battle tracker page', () => {
  let dom

  beforeEach(() => {
    dom = mountBattlePage({ roster: makeRoster() })
  })

  afterEach(() => {
    dom.window.close()
  })

  it('migrates the handed-off roster on load: backfilling internal systems and building a mech company for the catapult ship', async () => {
    const { document } = dom.window
    await redraw(dom)

    const [alphaFleet, betaFleet] = fleetElements(document)
    expect(fleetName(alphaFleet)).toBe('Alpha')
    expect(fleetName(betaFleet)).toBe('Beta')

    const [alphaShip] = shipElements(alphaFleet)
    expect(systemCheckboxes(alphaShip)).toHaveLength(4) // attack, catapult, + 2 backfilled internal
    expect(companyElements(alphaFleet)).toHaveLength(1)
    expect(systemCheckboxes(companyElements(alphaFleet)[0])).toHaveLength(6)

    const [betaShip] = shipElements(betaFleet)
    expect(systemCheckboxes(betaShip)).toHaveLength(3) // defense + 2 backfilled internal
    expect(companyElements(betaFleet)).toHaveLength(0)

    const state = readBattleState(dom)
    const migratedAlphaShip = state.roster[0].ships[0]
    expect(migratedAlphaShip.systems.filter((s) => s.class === 'internal')).toHaveLength(2)
    expect(state.roster[0].companies).toHaveLength(1)
  })

  it('disabling one system on a ship checks its box and persists the disabled system, without destroying the ship', async () => {
    const { document } = dom.window
    await redraw(dom)
    const [alphaShip] = shipElements(fleetElements(document)[0])

    const attackCheckbox = systemCheckbox(alphaShip, 'Point Defense')
    click(attackCheckbox)
    await redraw(dom)

    expect(attackCheckbox.checked).toBe(true)
    expect(isDead(alphaShip)).toBe(false)

    const state = readBattleState(dom)
    const ship = state.roster[0].ships[0]
    expect(ship.systems.find((s) => s.class === 'attack').disabled).toBe(true)
    expect(ship.destroyed).toBe(false)
  })

  it('disabling every system on a ship marks it destroyed and decrements its fleet tas; re-enabling one system undoes it', async () => {
    const { document } = dom.window
    await redraw(dom)
    // battle.js rebuilds each ship/company's component (and thus DOM subtree) from scratch on
    // every redraw - see tests/helpers/load-battle-page.js - so elements are re-queried fresh from
    // `document` after each redraw rather than reused, matching how a real, live-rendered page
    // would be interacted with.
    const initialTas = readBattleState(dom).roster[1].tas
    const systemCount = systemCheckboxes(shipElements(fleetElements(document)[1])[0]).length

    for (let i = 0; i < systemCount; i++) {
      const box = systemCheckboxes(shipElements(fleetElements(document)[1])[0])[i]
      click(box)
      await redraw(dom)
    }

    expect(isDead(shipElements(fleetElements(document)[1])[0])).toBe(true)
    let state = readBattleState(dom)
    expect(state.roster[1].ships[0].destroyed).toBe(true)
    expect(state.roster[1].tas).toBe(initialTas - 1)

    click(systemCheckboxes(shipElements(fleetElements(document)[1])[0])[0])
    await redraw(dom)

    expect(isDead(shipElements(fleetElements(document)[1])[0])).toBe(false)
    state = readBattleState(dom)
    expect(state.roster[1].ships[0].destroyed).toBe(false)
    expect(state.roster[1].tas).toBe(initialTas)
  })

  it('disabling every system on a mech company marks it destroyed and decrements its fleet tas; re-enabling one system undoes it', async () => {
    const { document } = dom.window
    await redraw(dom)
    const initialTas = readBattleState(dom).roster[0].tas
    const systemCount = systemCheckboxes(companyElements(fleetElements(document)[0])[0]).length

    for (let i = 0; i < systemCount; i++) {
      const box = systemCheckboxes(companyElements(fleetElements(document)[0])[0])[i]
      click(box)
      await redraw(dom)
    }

    expect(isDead(companyElements(fleetElements(document)[0])[0])).toBe(true)
    let state = readBattleState(dom)
    expect(state.roster[0].companies[0].destroyed).toBe(true)
    expect(state.roster[0].tas).toBe(initialTas - 1)

    click(systemCheckboxes(companyElements(fleetElements(document)[0])[0])[0])
    await redraw(dom)

    expect(isDead(companyElements(fleetElements(document)[0])[0])).toBe(false)
    state = readBattleState(dom)
    expect(state.roster[0].companies[0].destroyed).toBe(false)
    expect(state.roster[0].tas).toBe(initialTas)
  })

  it("toggling a mech company's fuel state marks it out of fuel, decrements tas, and disables its system checkboxes", async () => {
    const { document } = dom.window
    await redraw(dom)
    const initialTas = readBattleState(dom).roster[0].tas

    click(fuelButton(companyElements(fleetElements(document)[0])[0]))
    await redraw(dom)

    const companyAfterOut = companyElements(fleetElements(document)[0])[0]
    expect(isDead(companyAfterOut)).toBe(true)
    systemCheckboxes(companyAfterOut).forEach((box) => expect(box.disabled).toBe(true))
    let state = readBattleState(dom)
    expect(state.roster[0].companies[0].outOfFuel).toBe(true)
    expect(state.roster[0].tas).toBe(initialTas - 1)

    click(fuelButton(companyElements(fleetElements(document)[0])[0]))
    await redraw(dom)

    const companyAfterIn = companyElements(fleetElements(document)[0])[0]
    expect(isDead(companyAfterIn)).toBe(false)
    systemCheckboxes(companyAfterIn).forEach((box) => expect(box.disabled).toBe(false))
    state = readBattleState(dom)
    expect(state.roster[0].companies[0].outOfFuel).toBe(false)
    expect(state.roster[0].tas).toBe(initialTas)
  })

  it('transferring a ship in a two-fleet battle moves it to the other fleet immediately, adjusting tas on both sides and marking it captured', async () => {
    const { document } = dom.window
    await redraw(dom)
    const alphaShipBefore = shipElements(fleetElements(document)[0])[0]
    expect(isCaptured(alphaShipBefore)).toBe(false)
    const initialAlphaTas = readBattleState(dom).roster[0].tas
    const initialBetaTas = readBattleState(dom).roster[1].tas
    const originalOwnerId = readBattleState(dom).roster[0].ships[0].owner

    click(transferButton(alphaShipBefore))
    await redraw(dom)

    const [alphaFleet, betaFleet] = fleetElements(document)
    expect(shipElements(alphaFleet)).toHaveLength(0)
    const transferredShip = shipElements(betaFleet).find((el) => el.querySelector('.asset-name').textContent.includes('Alpha One'))
    expect(transferredShip).toBeTruthy()
    // The ship keeps its original owner id - only its location in the roster's fleets changes, not
    // this field. That's a game-rules requirement, not just a display artifact: the original owner
    // retains control over the ship's system (white) dice even after capture, so the app needs to
    // keep tracking who that original owner was. The "captured" class on the ship's title is the
    // visual surfacing of that same fact.
    expect(isCaptured(transferredShip)).toBe(true)

    const state = readBattleState(dom)
    expect(state.roster[0].ships).toHaveLength(0)
    expect(state.roster[1].ships.map((s) => s.name)).toEqual(['Beta One', 'Alpha One'])
    expect(state.roster[1].ships[1].owner).toBe(originalOwnerId)
    expect(state.roster[0].tas).toBe(initialAlphaTas - 1)
    expect(state.roster[1].tas).toBe(initialBetaTas + 1)
  })
})

// total/role are Vue `computed` properties (see support/battle.js's attachComputedTotalAndRole and
// the spike at .scratch/support-domain-split/issues/02-spike-computed-total-and-role.md) rather
// than fields set by an imperative recalculate()/determineRole() call - these characterize that
// they stay correct, read straight off the rendered scoreboard, across every mutation path that
// used to carry its own recalculate() call.
describe('total / role (computed from ppa/hva/tas)', () => {
  let dom

  beforeEach(() => {
    dom = mountBattlePage({ roster: makeRoster() })
  })

  afterEach(() => {
    dom.window.close()
  })

  it('starts with total = ppa * (hva + tas) and assigns Defender/Primary attacker across the roster', async () => {
    const { document } = dom.window
    await redraw(dom)

    const [alphaCard, betaCard] = playerCards(document)
    expect(playerTotal(alphaCard)).toBe(25) // 5 * (3 + 2)
    expect(playerTotal(betaCard)).toBe(20) // 5 * (3 + 1)
    expect(playerRole(alphaCard)).toBe('Defender')
    expect(playerRole(betaCard)).toBe('Primary attacker')
  })

  it('recomputes total and swaps roles when HVA is edited via its input, with no imperative recalculate call', async () => {
    const { document } = dom.window
    await redraw(dom)

    setValue(hvaInput(playerCards(document)[1]), '10')
    await redraw(dom)

    const [alphaCard, betaCard] = playerCards(document)
    expect(playerTotal(betaCard)).toBe(55) // 5 * (10 + 1)
    expect(playerRole(betaCard)).toBe('Defender')
    expect(playerRole(alphaCard)).toBe('Primary attacker')
  })

  it('recomputes total when system damage destroys a ship (decrementing fleet tas) and again when reviving it', async () => {
    const { document } = dom.window
    await redraw(dom)
    const betaShip = shipElements(fleetElements(document)[1])[0]
    const boxes = systemCheckboxes(betaShip)

    for (let i = 0; i < boxes.length; i++) {
      click(systemCheckboxes(shipElements(fleetElements(document)[1])[0])[i])
      await redraw(dom)
    }

    expect(playerTotal(playerCards(document)[1])).toBe(15) // beta tas 1 -> 0: 5 * (3 + 0)

    click(systemCheckboxes(shipElements(fleetElements(document)[1])[0])[0])
    await redraw(dom)

    expect(playerTotal(playerCards(document)[1])).toBe(20) // beta tas back to 1: 5 * (3 + 1)
  })

  it('recomputes total when a mech company runs out of fuel, resolving a tie to Primary attacker for both fleets', async () => {
    const { document } = dom.window
    await redraw(dom)

    click(fuelButton(companyElements(fleetElements(document)[0])[0]))
    await redraw(dom)

    // Alpha's tas drops 2 -> 1: total = 5 * (3 + 1) = 20, tying Beta's untouched total of 20.
    const [alphaCard, betaCard] = playerCards(document)
    expect(playerTotal(alphaCard)).toBe(20)
    expect(playerTotal(betaCard)).toBe(20)
    expect(playerRole(alphaCard)).toBe('Primary attacker')
    expect(playerRole(betaCard)).toBe('Primary attacker')
  })

  it('recomputes total and role on both fleets after a ship transfer, with no call site left to forget it', async () => {
    const { document } = dom.window
    await redraw(dom)

    click(transferButton(shipElements(fleetElements(document)[0])[0]))
    await redraw(dom)

    const [alphaCard, betaCard] = playerCards(document)
    expect(playerTotal(alphaCard)).toBe(20) // alpha tas 2 -> 1: 5 * (3 + 1)
    expect(playerTotal(betaCard)).toBe(25) // beta tas 1 -> 2: 5 * (3 + 2)
    expect(playerRole(alphaCard)).toBe('Primary attacker')
    expect(playerRole(betaCard)).toBe('Defender')
  })
})
