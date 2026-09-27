import { expect, test } from '@playwright/test'

// Regression tests for the tactical redesign (ticket 03, see .scratch/tactical-redesign) covering
// real-browser CSS/layout behavior that tests/battles.test.js's jsdom suite can't see - jsdom has
// no layout engine, so it can't catch horizontal overflow or a media query's effect. See
// tests/e2e/battle-tactical.spec.js (ticket 01) for the same rationale.

function roster() {
  return [{ name: 'Alpha', hva: 3, tas: 2, ppa: 5, ships: [{ name: 'Alpha One', class: 'capital', systems: [], destroyed: false }] }]
}

async function seedBattle(page, battleId) {
  await page.goto('/battle.html')
  await page.evaluate(({ r, id }) => storeBattle(r, true, true, id), { r: roster(), id: battleId })
}

test.describe('battles list tactical redesign', () => {
  test('renders edge-to-edge with no default browser body margin', async ({ page }) => {
    await seedBattle(page, 2001)
    await page.goto('/battles.html')
    await page.waitForSelector('.battle-card')

    const { margin, background } = await page.evaluate(() => {
      const style = getComputedStyle(document.body)
      return { margin: style.marginTop, background: style.backgroundColor }
    })

    expect(margin).toBe('0px')
    expect(background).toBe('rgb(18, 21, 26)')
  })

  test('does not overflow horizontally at mobile width', async ({ page }) => {
    await seedBattle(page, 2002)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/battles.html')
    await page.waitForSelector('.battle-card')

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBe(0)
  })

  test('lists multiple saved battles as distinct cards with primary/danger actions, and forfeit empties the list', async ({ page }) => {
    await seedBattle(page, 2003)
    await seedBattle(page, 2004)
    await page.goto('/battles.html')

    const cards = page.locator('.battle-card')
    await expect(cards).toHaveCount(2)

    const firstCard = cards.first()
    await expect(firstCard.getByRole('link', { name: /Resume/ })).toBeVisible()
    const forfeitButton = firstCard.getByRole('button', { name: /Forfeit/ })
    await expect(forfeitButton).toBeVisible()

    await forfeitButton.click()
    await expect(cards).toHaveCount(1)

    await page
      .locator('.battle-card')
      .getByRole('button', { name: /Forfeit/ })
      .click()
    await expect(page.locator('.empty-state-message')).toBeVisible()
    await expect(page.locator('.empty-state-message')).toHaveText('No battles yet. Grab your bricks, dice and get to it!')
  })

  test('resume link navigates to the right battle', async ({ page }) => {
    await seedBattle(page, 2005)
    await page.goto('/battles.html')

    await page.getByRole('link', { name: /Resume/ }).click()
    await expect(page).toHaveURL(/battle\.html\?battleId=2005/)
  })
})
