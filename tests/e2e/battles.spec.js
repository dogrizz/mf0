import { expect, test } from '@playwright/test'

// Characterization tests for the battles list page (battles.html / battles.js), migrated from the
// jsdom-based tests/battles.test.js (ticket 01, see .scratch/retire-jsdom-and-sync-xhr/spec.md) to
// run against the real static site instead. Complements tests/e2e/battles-tactical.spec.js, which
// covers CSS/layout regressions rather than behavior.

function roster(name) {
  return [{ name, hva: 3, tas: 2, ppa: 5, ships: [{ name: name + ' One', class: 'capital', systems: [], destroyed: false }] }]
}

// Seeds localStorage['mf0-battles'] the same way the fleet builder's "Fight!" button does (calling
// the real storeBattle(), not writing localStorage directly) - matching seedBattle() in
// tests/e2e/battle-tactical.spec.js/battles-tactical.spec.js.
async function seedBattle(page, battleId) {
  await page.goto('/battle.html')
  await page.evaluate(({ r, id }) => storeBattle(r, true, true, id), { r: roster('Fleet ' + battleId), id: battleId })
}

async function storedDate(page, battleId) {
  return page.evaluate((id) => JSON.parse(localStorage.getItem('mf0-battles'))[id].date, battleId)
}

async function readBattlesState(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('mf0-battles')))
}

function battleRows(page) {
  return page.locator('.battle-card')
}

test.describe('battles list page', () => {
  test('shows an empty-state message when there are no saved battles', async ({ page }) => {
    await page.goto('/battles.html')

    await expect(battleRows(page)).toHaveCount(0)
    await expect(page.locator('.empty-state-message')).toHaveText('No battles yet. Grab your bricks, dice and get to it!')
  })

  test('lists saved battles from localStorage, one row per battle with its saved date', async ({ page }) => {
    await seedBattle(page, 7001)
    await seedBattle(page, 7002)
    const dateA = await storedDate(page, 7001)
    const dateB = await storedDate(page, 7002)

    await page.goto('/battles.html')

    const rows = battleRows(page)
    await expect(rows).toHaveCount(2)
    await expect(rows.nth(0).locator('.battle-date')).toHaveText(`Battle from ${new Date(dateA).toLocaleString()}`)
    await expect(rows.nth(1).locator('.battle-date')).toHaveText(`Battle from ${new Date(dateB).toLocaleString()}`)
  })

  test("resume links point at the battle's own battle.html?battleId=<id>", async ({ page }) => {
    await seedBattle(page, 7003)
    await seedBattle(page, 7004)

    await page.goto('/battles.html')

    const rows = battleRows(page)
    await expect(rows.nth(0).getByRole('link', { name: /Resume/ })).toHaveAttribute('href', 'battle.html?battleId=7003')
    await expect(rows.nth(1).getByRole('link', { name: /Resume/ })).toHaveAttribute('href', 'battle.html?battleId=7004')
  })

  test('forfeiting a battle removes it from localStorage and the list, leaving the other battle', async ({ page }) => {
    await seedBattle(page, 7005)
    await seedBattle(page, 7006)
    await page.goto('/battles.html')

    const rows = battleRows(page)
    await expect(rows).toHaveCount(2)
    await rows
      .first()
      .getByRole('button', { name: /Forfeit/ })
      .click()

    await expect(rows).toHaveCount(1)
    await expect(rows.first().getByRole('link', { name: /Resume/ })).toHaveAttribute('href', 'battle.html?battleId=7006')
    expect(Object.keys(await readBattlesState(page))).toEqual(['7006'])
  })

  test('forfeiting the last battle leaves the empty-state message and an empty stored object', async ({ page }) => {
    await seedBattle(page, 7007)
    await page.goto('/battles.html')

    await battleRows(page)
      .first()
      .getByRole('button', { name: /Forfeit/ })
      .click()

    await expect(battleRows(page)).toHaveCount(0)
    await expect(page.locator('.empty-state-message')).toHaveText('No battles yet. Grab your bricks, dice and get to it!')
    expect(await readBattlesState(page)).toEqual({})
  })
})
