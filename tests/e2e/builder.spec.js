import { expect, test } from '@playwright/test'

// Characterization tests for the fleet builder page (index.html / builder.js), migrated from the
// jsdom-based tests/builder.test.js (ticket 01, see .scratch/retire-jsdom-and-sync-xhr/spec.md) to
// run against the real static site instead. Driven purely through Playwright
// locators/interactions and asserted against the rendered DOM and localStorage['mf0-tools'] -
// never Vue internals - so this suite keeps passing unmodified once ticket 02 converts these
// components' template loading to fetch()+defineAsyncComponent.

async function readToolsState(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('mf0-tools')
    return raw === null ? null : JSON.parse(raw)
  })
}

// The fleet-builder disclosure (ship/system editing) starts collapsed. Assertions on its contents
// work regardless (Playwright's count/text expectations don't require visibility), but clicking or
// selecting inside it does - a real browser (unlike jsdom) enforces actionability, so any test that
// interacts inside .disclosure-body must expand it first.
async function expandFleetBuilder(page) {
  await page.getByRole('button', { name: /Fleet builder/ }).click()
}

function scoreboardRows(page) {
  return page.locator('.scoreboard .stat-card')
}

function fleetSections(page) {
  return page.locator('.disclosure-body .fleet-section')
}

function shipsIn(fleetEl) {
  return fleetEl.locator('[data-kind="ship"]')
}

function diceChip(shipEl) {
  return shipEl.locator('.chip')
}

test.describe('fleet builder page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html')
  })

  test('adds a player to the scoreboard and the fleet builder accordion, persisting defaults', async ({ page }) => {
    await page.getByRole('button', { name: 'Add player' }).click()

    await expect(scoreboardRows(page)).toHaveCount(1)
    await expect(scoreboardRows(page).first().locator('.stat-card-name-input')).toHaveValue('Player')
    await expect(fleetSections(page)).toHaveCount(1)
    await expect(fleetSections(page).first().locator('h2')).toHaveText('Player')

    expect(await readToolsState(page)).toEqual({
      players: [{ name: 'Player', hva: 3, tas: 5, systems: 10, ppa: 5, total: 40, ships: [] }],
      track: false,
      sync: false,
    })
  })

  test('backfills total for a fleet saved before calculatePPA computed it', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem(
        'mf0-tools',
        JSON.stringify({ players: [{ name: 'Player', hva: 3, tas: 5, systems: 10, ppa: 5, ships: [] }], track: false, sync: false }),
      )
    })
    await page.reload()

    await expect(scoreboardRows(page)).toHaveCount(1)
    const readouts = scoreboardRows(page).first().locator('.stat-readout-value')
    await expect(readouts.nth(1)).toHaveText(String(5 * (3 + 5)))
    expect((await readToolsState(page)).players[0].total).toBe(40)
  })

  test('adding a ship to a fleet gets a random name and defaults to a frigate loadout', async ({ page }) => {
    await page.getByRole('button', { name: 'Add player' }).click()
    await expandFleetBuilder(page)
    const fleet = fleetSections(page).first()

    await fleet.getByRole('button', { name: 'Add ship' }).click()

    const ship = shipsIn(fleet)
    await expect(ship).toHaveCount(1)
    await expect(ship.locator('.ship-class-select')).toHaveValue('frigate')
    await expect(ship.locator('.system-slot-class-select')).toHaveCount(3)
    await expect(diceChip(ship)).toHaveText('2W1G')

    const storedShip = (await readToolsState(page)).players[0].ships[0]
    expect(storedShip.class).toBe('frigate')
    expect(storedShip.systems).toEqual([{ class: '' }, { class: '' }, { class: '' }])
  })

  test('setting a system slot to attack updates dice notation and localStorage with the default attack type', async ({ page }) => {
    await page.getByRole('button', { name: 'Add player' }).click()
    await expandFleetBuilder(page)
    const fleet = fleetSections(page).first()
    await fleet.getByRole('button', { name: 'Add ship' }).click()
    const ship = shipsIn(fleet)

    await ship.locator('.system-slot-class-select').first().selectOption('attack')

    await expect(diceChip(ship)).toHaveText('2W1G2Rp')
    const storedSystem = (await readToolsState(page)).players[0].ships[0].systems[0]
    expect(storedSystem).toEqual({ class: 'attack', attackType: 'p' })
  })

  test('setting a system slot to catapult reveals the mech company section, which disappears once removed', async ({ page }) => {
    await page.getByRole('button', { name: 'Add player' }).click()
    await expandFleetBuilder(page)
    const fleet = fleetSections(page).first()
    await fleet.getByRole('button', { name: 'Add ship' }).click()
    const ship = shipsIn(fleet)
    const mechCompanySection = ship.locator('.ace-picker')

    await expect(mechCompanySection).toHaveCount(0)

    await ship.locator('.system-slot-class-select').first().selectOption('catapult')

    await expect(mechCompanySection).toHaveCount(1)
    await expect(diceChip(ship)).toHaveText('2W1G1K')
    expect((await readToolsState(page)).players[0].ships[0].systems[0].class).toBe('catapult')

    await ship.locator('.system-slot-class-select').first().selectOption('')

    await expect(mechCompanySection).toHaveCount(0)
    expect((await readToolsState(page)).players[0].ships[0].systems[0].class).toBe('')
  })

  test('changing ship class resets the systems list to the new class max, clearing any catapult/mech company', async ({ page }) => {
    await page.getByRole('button', { name: 'Add player' }).click()
    await expandFleetBuilder(page)
    const fleet = fleetSections(page).first()
    await fleet.getByRole('button', { name: 'Add ship' }).click()
    const ship = shipsIn(fleet)

    await ship.locator('.system-slot-class-select').first().selectOption('catapult')
    await expect(ship.locator('.ace-picker')).toHaveCount(1)

    await ship.locator('.ship-class-select').selectOption('capital')

    const systemSelects = ship.locator('.system-slot-class-select')
    await expect(systemSelects).toHaveCount(4)
    for (const value of await systemSelects.evaluateAll((selects) => selects.map((select) => select.value))) {
      expect(value).toBe('')
    }
    await expect(ship.locator('.ace-picker')).toHaveCount(0)
    await expect(diceChip(ship)).toHaveText('2W')

    const storedShip = (await readToolsState(page)).players[0].ships[0]
    expect(storedShip.class).toBe('capital')
    expect(storedShip.systems).toEqual([{ class: '' }, { class: '' }, { class: '' }, { class: '' }])
  })

  test('recalculates PPA live across the roster as fleets change, favoring the smaller fleet', async ({ page }) => {
    await page.getByRole('button', { name: 'Add player' }).click()
    await page.getByRole('button', { name: 'Add player' }).click()
    expect((await readToolsState(page)).players.map((p) => p.ppa)).toEqual([5, 5])

    await expandFleetBuilder(page)
    await page.locator('.sync-check').click()
    expect((await readToolsState(page)).players.map((p) => ({ ppa: p.ppa, tas: p.tas, systems: p.systems }))).toEqual([
      { ppa: 5, tas: 0, systems: 0 },
      { ppa: 5, tas: 0, systems: 0 },
    ])

    const [fleetA] = await fleetSections(page).all()
    await fleetA.getByRole('button', { name: 'Add ship' }).click()

    let state = await readToolsState(page)
    expect(state.players[0]).toMatchObject({ ppa: 4, tas: 1, systems: 0 })
    expect(state.players[1]).toMatchObject({ ppa: 6, tas: 0, systems: 0 })
    // The scoreboard's live PPA/total display for fleet A's row, not just localStorage.
    const rowA = scoreboardRows(page).first()
    const readouts = rowA.locator('.stat-readout-value')
    await expect(readouts.first()).toHaveText('4')
    await expect(readouts.nth(1)).toHaveText(String(4 * (3 + 1)))

    const shipA = shipsIn(fleetA)
    await shipA.locator('.system-slot-class-select').first().selectOption('attack')

    state = await readToolsState(page)
    expect(state.players[0]).toMatchObject({ ppa: 3, tas: 1, systems: 1 })
    expect(state.players[1]).toMatchObject({ ppa: 7, tas: 0, systems: 0 })
  })

  test('Fight! hands the roster off to storeBattle() and navigates to the battle tracker', async ({ page }) => {
    await page.getByRole('button', { name: 'Add player' }).click()
    await page.locator('.stat-card-name-input').fill('Odyssey Fleet')

    await page.getByRole('button', { name: 'Fight!' }).click()

    await expect(page).toHaveURL(/battle\.html\?battleId=\d+/)
    await expect(page.locator('.scoreboard .stat-card-name')).toContainText('Odyssey Fleet')

    const battleId = new URL(page.url()).searchParams.get('battleId')
    const storedRoster = await page.evaluate((id) => {
      const battles = JSON.parse(localStorage.getItem('mf0-battles'))
      return JSON.parse(LZString.decompress(battles[id].data)).roster
    }, battleId)
    expect(storedRoster[0].name).toBe('Odyssey Fleet')
  })
})
