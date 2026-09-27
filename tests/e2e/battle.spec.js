import { expect, test } from '@playwright/test'

// Characterization tests for the battle tracker page (battle.html / battle.js), migrated from the
// jsdom-based tests/battle.test.js (ticket 01, see .scratch/retire-jsdom-and-sync-xhr/spec.md) to
// run against the real static site instead. Complements tests/e2e/battle-tactical.spec.js, which
// covers CSS/layout regressions rather than behavior.
//
// The fixture roster is shaped the way the fleet builder hands one off: two fleets, each with one
// ship and no `internal` systems, ids, or mech companies yet - those are all added by readBattle()'s
// lazy migration when battle.js's page-load script first reads this battle. Alpha's ship carries a
// catapult (so a mech company gets built for it); Beta's does not.
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

// Seeds localStorage['mf0-battles'] the same way the fleet builder's "Fight!" button does (calling
// the real storeBattle(), not writing localStorage directly), then loads the battle for real -
// matching seedBattle() in tests/e2e/battle-tactical.spec.js. A fresh, distinct battleId per test
// keeps them independent since storeBattle persists to the same origin's localStorage across page
// loads within a test.
async function seedBattle(page, battleId) {
  await page.goto('/battle.html')
  await page.evaluate(({ r, id }) => storeBattle(r, true, true, id), { r: makeRoster(), id: battleId })
  await page.goto(`/battle.html?battleId=${battleId}`)
  await page.waitForSelector('.fleet-section')
}

async function readBattleState(page, battleId) {
  return page.evaluate((id) => {
    const battles = JSON.parse(localStorage.getItem('mf0-battles'))
    return JSON.parse(LZString.decompress(battles[id].data))
  }, battleId)
}

function fleetSections(page) {
  return page.locator('.fleet-section')
}

function shipsIn(fleetEl) {
  return fleetEl.locator('[data-kind="ship"]')
}

function companiesIn(fleetEl) {
  return fleetEl.locator('[data-kind="company"]')
}

function systemCheckboxes(el) {
  return el.locator('.system-row .system-check')
}

// Finds a system checkbox by its rendered label text (e.g. 'Point Defense', 'defense', 'weapon') -
// scoped to a ship or company locator, since both render one system-row per system.
function systemCheckbox(el, labelText) {
  return el.locator('.system-row', { hasText: labelText }).locator('.system-check')
}

function transferButton(shipEl) {
  return shipEl.locator('.icon-btn[aria-label="Transfer ship"]')
}

function fuelButton(companyEl) {
  return companyEl.locator('.icon-btn[aria-label="Toggle fuel state"]')
}

test.describe('battle tracker page', () => {
  test('migrates the handed-off roster on load: backfilling internal systems and building a mech company for the catapult ship', async ({
    page,
  }) => {
    await seedBattle(page, 4001)

    const [alphaFleet, betaFleet] = await fleetSections(page).all()
    await expect(alphaFleet.locator('h2')).toHaveText('Alpha')
    await expect(betaFleet.locator('h2')).toHaveText('Beta')

    const alphaShip = shipsIn(alphaFleet)
    await expect(systemCheckboxes(alphaShip)).toHaveCount(4) // attack, catapult, + 2 backfilled internal
    await expect(companiesIn(alphaFleet)).toHaveCount(1)
    await expect(systemCheckboxes(companiesIn(alphaFleet))).toHaveCount(6)

    const betaShip = shipsIn(betaFleet)
    await expect(systemCheckboxes(betaShip)).toHaveCount(3) // defense + 2 backfilled internal
    await expect(companiesIn(betaFleet)).toHaveCount(0)

    const state = await readBattleState(page, 4001)
    const migratedAlphaShip = state.roster[0].ships[0]
    expect(migratedAlphaShip.systems.filter((s) => s.class === 'internal')).toHaveLength(2)
    expect(state.roster[0].companies).toHaveLength(1)
  })

  test('disabling one system on a ship checks its box and persists the disabled system, without destroying the ship', async ({ page }) => {
    await seedBattle(page, 4002)
    const alphaShip = shipsIn(fleetSections(page).first())

    const attackCheckbox = systemCheckbox(alphaShip, 'Point Defense')
    await attackCheckbox.click()

    await expect(attackCheckbox).toBeChecked()
    await expect(alphaShip).not.toHaveClass(/is-dead/)

    const state = await readBattleState(page, 4002)
    const ship = state.roster[0].ships[0]
    expect(ship.systems.find((s) => s.class === 'attack').disabled).toBe(true)
    expect(ship.destroyed).toBe(false)
  })

  test('disabling every system on a ship marks it destroyed and decrements its fleet tas; re-enabling one system undoes it', async ({
    page,
  }) => {
    await seedBattle(page, 4003)
    const betaShip = shipsIn(fleetSections(page).nth(1))
    const initialTas = (await readBattleState(page, 4003)).roster[1].tas

    const checks = systemCheckboxes(betaShip)
    const count = await checks.count()
    for (let i = 0; i < count; i++) {
      await checks.nth(i).click()
    }

    await expect(betaShip).toHaveClass(/is-dead/)
    let state = await readBattleState(page, 4003)
    expect(state.roster[1].ships[0].destroyed).toBe(true)
    expect(state.roster[1].tas).toBe(initialTas - 1)

    await checks.first().click()

    await expect(betaShip).not.toHaveClass(/is-dead/)
    state = await readBattleState(page, 4003)
    expect(state.roster[1].ships[0].destroyed).toBe(false)
    expect(state.roster[1].tas).toBe(initialTas)
  })

  test('disabling every system on a mech company marks it destroyed and decrements its fleet tas; re-enabling one system undoes it', async ({
    page,
  }) => {
    await seedBattle(page, 4004)
    const company = companiesIn(fleetSections(page).first())
    const initialTas = (await readBattleState(page, 4004)).roster[0].tas

    const checks = systemCheckboxes(company)
    const count = await checks.count()
    for (let i = 0; i < count; i++) {
      await checks.nth(i).click()
    }

    await expect(company).toHaveClass(/is-dead/)
    let state = await readBattleState(page, 4004)
    expect(state.roster[0].companies[0].destroyed).toBe(true)
    expect(state.roster[0].tas).toBe(initialTas - 1)

    await checks.first().click()

    await expect(company).not.toHaveClass(/is-dead/)
    state = await readBattleState(page, 4004)
    expect(state.roster[0].companies[0].destroyed).toBe(false)
    expect(state.roster[0].tas).toBe(initialTas)
  })

  test("toggling a mech company's fuel state marks it out of fuel, decrements tas, and disables its system checkboxes", async ({
    page,
  }) => {
    await seedBattle(page, 4005)
    const company = companiesIn(fleetSections(page).first())
    const initialTas = (await readBattleState(page, 4005)).roster[0].tas
    const fuel = fuelButton(company)
    const checks = systemCheckboxes(company)
    const count = await checks.count()

    await fuel.click()

    await expect(company).toHaveClass(/is-dead/)
    for (let i = 0; i < count; i++) {
      await expect(checks.nth(i)).toBeDisabled()
    }
    let state = await readBattleState(page, 4005)
    expect(state.roster[0].companies[0].outOfFuel).toBe(true)
    expect(state.roster[0].tas).toBe(initialTas - 1)

    await fuel.click()

    await expect(company).not.toHaveClass(/is-dead/)
    for (let i = 0; i < count; i++) {
      await expect(checks.nth(i)).toBeEnabled()
    }
    state = await readBattleState(page, 4005)
    expect(state.roster[0].companies[0].outOfFuel).toBe(false)
    expect(state.roster[0].tas).toBe(initialTas)
  })

  test('transferring a ship in a two-fleet battle moves it to the other fleet immediately, adjusting tas on both sides and marking it captured', async ({
    page,
  }) => {
    await seedBattle(page, 4006)
    const [alphaFleet, betaFleet] = await fleetSections(page).all()
    const alphaShipBefore = shipsIn(alphaFleet)
    await expect(alphaShipBefore.locator('.asset-name')).not.toHaveClass(/captured/)

    const before = await readBattleState(page, 4006)
    const initialAlphaTas = before.roster[0].tas
    const initialBetaTas = before.roster[1].tas
    const originalOwnerId = before.roster[0].ships[0].owner

    await transferButton(alphaShipBefore).click()

    await expect(shipsIn(alphaFleet)).toHaveCount(0)
    // The ship keeps its original owner id - only its location in the roster's fleets changes, not
    // this field. That's a game-rules requirement, not just a display artifact: the original owner
    // retains control over the ship's system (white) dice even after capture, so the "captured"
    // badge/name styling below surfaces who that was.
    const transferredShip = shipsIn(betaFleet).filter({ hasText: 'Alpha One' })
    await expect(transferredShip).toHaveCount(1)
    await expect(transferredShip.locator('.asset-name')).toHaveClass(/captured/)

    const state = await readBattleState(page, 4006)
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
test.describe('total / role (computed from ppa/hva/tas)', () => {
  function playerCards(page) {
    return page.locator('.scoreboard .stat-card')
  }

  function playerTotal(cardEl) {
    return cardEl.locator('.stat-readout-value').nth(1)
  }

  function playerRole(cardEl) {
    return cardEl.locator('.badge')
  }

  test('starts with total = ppa * (hva + tas) and assigns Defender/Primary attacker across the roster', async ({ page }) => {
    await seedBattle(page, 4101)
    const [alphaCard, betaCard] = await playerCards(page).all()

    await expect(playerTotal(alphaCard)).toHaveText('25') // 5 * (3 + 2)
    await expect(playerTotal(betaCard)).toHaveText('20') // 5 * (3 + 1)
    await expect(playerRole(alphaCard)).toHaveText('Defender')
    await expect(playerRole(betaCard)).toHaveText('Primary attacker')
  })

  test('recomputes total and swaps roles when HVA is edited via its input, with no imperative recalculate call', async ({ page }) => {
    await seedBattle(page, 4102)
    const [alphaCard, betaCard] = await playerCards(page).all()

    await betaCard.locator('input').first().fill('10')

    await expect(playerTotal(betaCard)).toHaveText('55') // 5 * (10 + 1)
    await expect(playerRole(betaCard)).toHaveText('Defender')
    await expect(playerRole(alphaCard)).toHaveText('Primary attacker')
  })

  test('recomputes total when system damage destroys a ship (decrementing fleet tas) and again when reviving it', async ({ page }) => {
    await seedBattle(page, 4103)
    const betaFleet = fleetSections(page).nth(1)
    const checks = systemCheckboxes(shipsIn(betaFleet))
    const count = await checks.count()
    for (let i = 0; i < count; i++) {
      await checks.nth(i).click()
    }

    await expect(playerTotal(playerCards(page).nth(1))).toHaveText('15') // beta tas 1 -> 0: 5 * (3 + 0)

    await checks.first().click()

    await expect(playerTotal(playerCards(page).nth(1))).toHaveText('20') // beta tas back to 1: 5 * (3 + 1)
  })

  test('recomputes total when a mech company runs out of fuel, resolving a tie to Primary attacker for both fleets', async ({ page }) => {
    await seedBattle(page, 4104)
    await fuelButton(companiesIn(fleetSections(page).first())).click()

    // Alpha's tas drops 2 -> 1: total = 5 * (3 + 1) = 20, tying Beta's untouched total of 20.
    const [alphaCard, betaCard] = await playerCards(page).all()
    await expect(playerTotal(alphaCard)).toHaveText('20')
    await expect(playerTotal(betaCard)).toHaveText('20')
    await expect(playerRole(alphaCard)).toHaveText('Primary attacker')
    await expect(playerRole(betaCard)).toHaveText('Primary attacker')
  })

  test('recomputes total and role on both fleets after a ship transfer, with no call site left to forget it', async ({ page }) => {
    await seedBattle(page, 4105)
    await transferButton(shipsIn(fleetSections(page).first())).click()

    const [alphaCard, betaCard] = await playerCards(page).all()
    await expect(playerTotal(alphaCard)).toHaveText('20') // alpha tas 2 -> 1: 5 * (3 + 1)
    await expect(playerTotal(betaCard)).toHaveText('25') // beta tas 1 -> 2: 5 * (3 + 2)
    await expect(playerRole(alphaCard)).toHaveText('Primary attacker')
    await expect(playerRole(betaCard)).toHaveText('Defender')
  })
})
