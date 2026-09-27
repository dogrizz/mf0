import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  addPlayerButton,
  addShipButton,
  click,
  diceText,
  fleetElements,
  hasMechCompany,
  mountBuilderPage,
  readToolsState,
  redraw,
  scoreboardRows,
  setValue,
  shipClassSelect,
  shipElements,
  syncCheckbox,
  systemSelects,
} from './helpers/load-builder-page.js'

// Characterization tests for the fleet builder page (index.html / builder.js), driven purely
// through DOM events (click/select) and asserted against the rendered DOM and
// localStorage['mf0-tools'] - never against Mithril internals - so this suite keeps passing
// unmodified once the page is rewritten in Vue.
describe('fleet builder page', () => {
  let dom

  beforeEach(() => {
    dom = mountBuilderPage()
  })

  afterEach(() => {
    dom.window.close()
  })

  it('adds a player to the scoreboard and the fleet builder accordion, persisting defaults', async () => {
    const { document } = dom.window

    click(addPlayerButton(document))
    await redraw(dom)

    expect(scoreboardRows(document)).toHaveLength(1)
    expect(fleetElements(document)).toHaveLength(1)
    expect(fleetElements(document)[0].querySelector('h2').textContent).toBe('Player')

    expect(readToolsState(dom)).toEqual({
      players: [{ name: 'Player', hva: 3, tas: 5, systems: 10, ppa: 5, total: 40, ships: [] }],
      track: false,
      sync: false,
    })
  })

  it('backfills total for a fleet saved before calculatePPA computed it', async () => {
    dom.window.close()
    dom = mountBuilderPage({
      seedToolsState: {
        players: [{ name: 'Player', hva: 3, tas: 5, systems: 10, ppa: 5, ships: [] }],
        track: false,
        sync: false,
      },
    })
    const { document } = dom.window

    expect(scoreboardRows(document)).toHaveLength(1)
    const readoutValues = scoreboardRows(document)[0].querySelectorAll('.stat-readout-value')
    expect(readoutValues[1].textContent).toBe(String(5 * (3 + 5)))
    expect(readToolsState(dom).players[0].total).toBe(40)
  })

  it('adds a ship to a fleet with an empty frigate loadout', async () => {
    const { document } = dom.window
    click(addPlayerButton(document))
    await redraw(dom)

    const fleet = fleetElements(document)[0]
    click(addShipButton(fleet))
    await redraw(dom)

    const ships = shipElements(fleet)
    expect(ships).toHaveLength(1)
    expect(shipClassSelect(ships[0]).value).toBe('frigate')
    expect(systemSelects(ships[0])).toHaveLength(3)
    expect(diceText(ships[0])).toBe('2W1G')

    const [ship] = readToolsState(dom).players[0].ships
    expect(ship.class).toBe('frigate')
    expect(ship.systems).toEqual([{ class: '' }, { class: '' }, { class: '' }])
  })

  it('adding a system updates dice notation and localStorage', async () => {
    const { document } = dom.window
    click(addPlayerButton(document))
    await redraw(dom)
    const fleet = fleetElements(document)[0]
    click(addShipButton(fleet))
    await redraw(dom)
    const ship = shipElements(fleet)[0]

    setValue(systemSelects(ship)[0], 'attack')
    await redraw(dom)

    expect(diceText(ship)).toBe('2W1GRp2')
    expect(readToolsState(dom).players[0].ships[0].systems[0]).toEqual({ class: 'attack', attackType: 'p' })
  })

  it('setting a system to catapult reveals the mech company section, which disappears once removed', async () => {
    const { document } = dom.window
    click(addPlayerButton(document))
    await redraw(dom)
    const fleet = fleetElements(document)[0]
    click(addShipButton(fleet))
    await redraw(dom)
    const ship = shipElements(fleet)[0]

    expect(hasMechCompany(ship)).toBe(false)

    setValue(systemSelects(ship)[0], 'catapult')
    await redraw(dom)

    expect(hasMechCompany(ship)).toBe(true)
    expect(ship.querySelector('input[type="checkbox"]')).not.toBeNull()
    expect(diceText(ship)).toBe('2W1G1K')
    expect(readToolsState(dom).players[0].ships[0].systems[0].class).toBe('catapult')

    setValue(systemSelects(ship)[0], '')
    await redraw(dom)

    expect(hasMechCompany(ship)).toBe(false)
    expect(readToolsState(dom).players[0].ships[0].systems[0].class).toBe('')
  })

  it('changing ship class resets the systems list to the new class max, clearing any catapult/mech company', async () => {
    const { document } = dom.window
    click(addPlayerButton(document))
    await redraw(dom)
    const fleet = fleetElements(document)[0]
    click(addShipButton(fleet))
    await redraw(dom)
    const ship = shipElements(fleet)[0]

    setValue(systemSelects(ship)[0], 'catapult')
    await redraw(dom)
    expect(hasMechCompany(ship)).toBe(true)

    setValue(shipClassSelect(ship), 'capital')
    await redraw(dom)

    expect(systemSelects(ship)).toHaveLength(4)
    systemSelects(ship).forEach((select) => expect(select.value).toBe(''))
    expect(hasMechCompany(ship)).toBe(false)
    expect(diceText(ship)).toBe('2W')

    const storedShip = readToolsState(dom).players[0].ships[0]
    expect(storedShip.class).toBe('capital')
    expect(storedShip.systems).toEqual([{ class: '' }, { class: '' }, { class: '' }, { class: '' }])
  })

  it('recalculates PPA live across the roster as fleets change, favoring the smaller fleet', async () => {
    const { document } = dom.window
    const addPlayer = addPlayerButton(document)
    click(addPlayer)
    await redraw(dom)
    click(addPlayer)
    await redraw(dom)

    expect(readToolsState(dom).players.map((p) => p.ppa)).toEqual([5, 5])

    click(syncCheckbox(document))
    await redraw(dom)
    expect(readToolsState(dom).players.map((p) => ({ ppa: p.ppa, tas: p.tas, systems: p.systems }))).toEqual([
      { ppa: 5, tas: 0, systems: 0 },
      { ppa: 5, tas: 0, systems: 0 },
    ])

    const [fleetA, fleetB] = fleetElements(document)
    click(addShipButton(fleetA))
    await redraw(dom)

    let state = readToolsState(dom)
    expect(state.players[0]).toMatchObject({ ppa: 4, tas: 1, systems: 0 })
    expect(state.players[1]).toMatchObject({ ppa: 6, tas: 0, systems: 0 })
    // The scoreboard's live PPA/total display for fleet A's row, not just localStorage.
    const [rowA] = scoreboardRows(document)
    const displaySpans = rowA.querySelectorAll('.stat-readout-value')
    expect(displaySpans[0].textContent).toBe('4')
    expect(displaySpans[1].textContent).toBe(String(4 * (3 + 1)))

    const shipA = shipElements(fleetA)[0]
    setValue(systemSelects(shipA)[0], 'attack')
    await redraw(dom)

    state = readToolsState(dom)
    expect(state.players[0]).toMatchObject({ ppa: 3, tas: 1, systems: 1 })
    expect(state.players[1]).toMatchObject({ ppa: 7, tas: 0, systems: 0 })
    expect(fleetB.textContent).not.toBe('')
  })
})
