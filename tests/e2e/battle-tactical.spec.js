import { expect, test } from '@playwright/test'

// Regression tests for the tactical redesign (ticket 01, see .scratch/tactical-redesign) covering
// real-browser CSS/layout behavior that tests/battle.test.js's jsdom suite can't see - jsdom has
// no layout engine, so it can't catch horizontal overflow, a dead CSS rule silently winning the
// cascade, or a media query's effect. Each test below locks in a bug that was actually found and
// fixed this way (manual Playwright inspection) after tactical-redesign shipped.

// Three fleets - rather than tests/battle.test.js's two - so opening a ship transfer shows the
// picker dialog instead of transferring immediately (see vue-battle-ship.js's otherFleets()).
function roster() {
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
    {
      name: 'Gamma',
      hva: 2,
      tas: 1,
      ppa: 0,
      ships: [{ name: 'Gamma One', class: 'frigate', systems: [{ class: 'sensor' }], destroyed: false }],
    },
  ]
}

// Seeds localStorage['mf0-battles'] the same way the fleet builder's "Fight!" button does (calling
// the real storeBattle(), not writing localStorage directly), then loads the battle for real. A
// fresh, distinct battleId per test keeps them independent since storeBattle persists to the same
// origin's localStorage across page loads within a test.
async function seedBattle(page, battleId) {
  await page.goto('/battle.html')
  await page.evaluate(({ r, id }) => storeBattle(r, true, true, id), { r: roster(), id: battleId })
  await page.goto(`/battle.html?battleId=${battleId}`)
  await page.waitForSelector('.fleet-section')
}

async function openTransferDialog(page) {
  await page.locator('[data-kind="ship"]', { hasText: 'Gamma One' }).locator('.icon-btn[aria-label="Transfer ship"]').click()
  return page.locator('.dialog')
}

test.describe('battle tracker tactical redesign', () => {
  test('renders edge-to-edge with no default browser body margin', async ({ page }) => {
    await seedBattle(page, 1001)

    const { margin, background } = await page.evaluate(() => {
      const style = getComputedStyle(document.body)
      return { margin: style.marginTop, background: style.backgroundColor }
    })

    expect(margin).toBe('0px')
    // #12151a, style.css's --tac-bg token - was previously left as the browser's transparent
    // default, showing the page background (and the UA default 8px body margin) as a pale border.
    expect(background).toBe('rgb(18, 21, 26)')
  })

  test('does not overflow horizontally at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedBattle(page, 1002)

    // .root previously had no min-width: 0, so its default min-width: auto let the scoreboard's
    // scroll-snap content force the whole page to overflow instead of scrolling internally.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBe(0)
  })

  test('transfer dialog is actually visible when opened', async ({ page }) => {
    await seedBattle(page, 1003)

    const dialog = await openTransferDialog(page)

    // A leftover .overlay { visibility: hidden } rule from the pre-redesign markup used to win
    // the cascade over .root .overlay (which never set visibility), keeping this permanently
    // invisible despite `v-if="ship.showPopup"` rendering it into the DOM.
    await expect(dialog).toBeVisible()
    await expect(page.locator('.overlay')).toHaveCSS('visibility', 'visible')
  })

  test('transfer dialog becomes a full-width bottom sheet on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedBattle(page, 1004)

    const dialog = await openTransferDialog(page)
    await expect(dialog).toBeVisible()

    const box = await dialog.boundingBox()
    expect(box.width).toBeGreaterThan(370)
    expect(box.y + box.height).toBeGreaterThan(800)
  })

  test('transfer dialog stays a centered card on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1024 })
    await seedBattle(page, 1005)

    const dialog = await openTransferDialog(page)
    await expect(dialog).toBeVisible()

    const box = await dialog.boundingBox()
    expect(box.width).toBeLessThan(500)
    expect(box.y).toBeGreaterThan(50)
  })

  test('destroying a ship does not shift the card header or system list', async ({ page }) => {
    await seedBattle(page, 1006)

    const ship = page.locator('[data-kind="ship"]', { hasText: 'Alpha One' })

    // Measured relative to the card's own top, not the viewport - clicking several checkboxes in
    // a row can auto-scroll the page to keep the focused one in view, which would otherwise show
    // up as a spurious position change unrelated to the card's internal layout.
    async function systemListOffset() {
      return ship.evaluate((card) => card.querySelector('.system-list').getBoundingClientRect().top - card.getBoundingClientRect().top)
    }

    const headBefore = await ship.locator('.asset-card-head').boundingBox()
    const chipBefore = await ship.locator('.chip').boundingBox()
    const systemsOffsetBefore = await systemListOffset()

    // readBattle's migration backfills two internal systems onto every ship (see
    // support/battle.js), so Alpha One (attack + catapult in the fixture below) ends up with four
    // systems total. Disabling all of them destroys the ship, previously swapping the always-36px
    // transfer button for a shorter badge and collapsing the now-empty dice chip to its
    // padding-only height, both shifting the system list up (see .scratch/issues for the original
    // bug report).
    const checks = ship.locator('.system-check')
    const count = await checks.count()
    for (let i = 0; i < count; i++) {
      await checks.nth(i).click()
    }
    await expect(ship).toHaveClass(/is-dead/)

    const headAfter = await ship.locator('.asset-card-head').boundingBox()
    const chipAfter = await ship.locator('.chip').boundingBox()
    const systemsOffsetAfter = await systemListOffset()

    expect(headAfter.height).toBe(headBefore.height)
    expect(chipAfter.height).toBe(chipBefore.height)
    expect(systemsOffsetAfter).toBe(systemsOffsetBefore)

    // The empty chip still shows something rather than collapsing to just its border/padding.
    await expect(ship.locator('.chip')).not.toHaveText('')
  })
})
