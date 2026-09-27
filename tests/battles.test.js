import { afterEach, describe, expect, it } from 'vitest'
import {
  battleRows,
  click,
  emptyStateMessage,
  forfeitButton,
  mountBattlesPage,
  readBattlesState,
  redraw,
  resumeLink,
} from './helpers/load-battles-page.js'

// Characterization tests for the battles list page (battles.html / battles.js), driven purely
// through DOM events (click) and asserted against the rendered DOM and
// localStorage['mf0-battles'] - never against Mithril internals - so this suite keeps passing
// unmodified once the page is rewritten in Vue.
describe('battles list page', () => {
  let dom

  afterEach(() => {
    dom?.window.close()
  })

  it('shows an empty-state message when there are no saved battles', async () => {
    dom = mountBattlesPage()
    const { document } = dom.window

    expect(battleRows(document)).toHaveLength(0)
    expect(emptyStateMessage(document).textContent).toBe('No battles yet. Grab your bricks, dice and get to it!')
  })

  it('lists saved battles from localStorage, one row per battle with its saved date', async () => {
    const savedAt = Date.UTC(2026, 0, 15, 12, 0, 0)
    dom = mountBattlesPage({
      111: { data: 'compressed-a', date: savedAt },
      222: { data: 'compressed-b', date: savedAt },
    })
    const { document } = dom.window

    const rows = battleRows(document)
    expect(rows).toHaveLength(2)
    rows.forEach((row) => {
      expect(row.querySelector('.battle-date').textContent).toBe(`Battle from ${new Date(savedAt).toLocaleString()}`)
    })
  })

  it("resume links point at the battle's own battle.html?battleId=<id>", async () => {
    dom = mountBattlesPage({
      111: { data: 'compressed-a', date: Date.now() },
      222: { data: 'compressed-b', date: Date.now() },
    })
    const { document } = dom.window

    const [rowA, rowB] = battleRows(document)
    expect(resumeLink(rowA).getAttribute('href')).toBe('battle.html?battleId=111')
    expect(resumeLink(rowB).getAttribute('href')).toBe('battle.html?battleId=222')
  })

  it('forfeiting a battle removes it from localStorage and the list, leaving the other battle', async () => {
    dom = mountBattlesPage({
      111: { data: 'compressed-a', date: Date.now() },
      222: { data: 'compressed-b', date: Date.now() },
    })
    const { document } = dom.window

    const [rowA] = battleRows(document)
    click(forfeitButton(rowA))
    await redraw(dom)

    expect(battleRows(document)).toHaveLength(1)
    expect(resumeLink(battleRows(document)[0]).getAttribute('href')).toBe('battle.html?battleId=222')
    expect(readBattlesState(dom)).toEqual({ 222: { data: 'compressed-b', date: expect.any(Number) } })
  })

  it('forfeiting the last battle leaves the empty-state message and an empty stored object', async () => {
    dom = mountBattlesPage({
      111: { data: 'compressed-a', date: Date.now() },
    })
    const { document } = dom.window

    click(forfeitButton(battleRows(document)[0]))
    await redraw(dom)

    expect(battleRows(document)).toHaveLength(0)
    expect(emptyStateMessage(document).textContent).toBe('No battles yet. Grab your bricks, dice and get to it!')
    expect(readBattlesState(dom)).toEqual({})
  })
})
