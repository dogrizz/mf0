import { beforeEach, describe, expect, it } from 'vitest'
import {
  calculatePPA,
  companyDice,
  determineRole,
  dice,
  readBattle,
  readBattles,
  recalculate,
  store,
  storeBattle,
} from './helpers/load-support.js'

beforeEach(() => {
  localStorage.clear()
})

function ship(overrides = {}) {
  return { name: 'Ship', class: 'capital', systems: [], destroyed: false, ...overrides }
}

function player(overrides = {}) {
  return { name: 'Player', hva: 0, tas: 0, systems: 0, ships: [], ...overrides }
}

describe('calculatePPA', () => {
  it('does nothing when there are no players', () => {
    const players = []
    expect(calculatePPA(players, false)).toBeUndefined()
    expect(players).toEqual([])
  })

  it('leaves every player at baseline ppa when tas and systems are tied', () => {
    const players = [player({ tas: 3, systems: 5 }), player({ tas: 3, systems: 5 })]
    calculatePPA(players, false)
    expect(players.map((p) => p.ppa)).toEqual([5, 5])
  })

  it('penalizes the max tas and rewards the min tas, leaving the middle untouched', () => {
    const players = [
      player({ name: 'high', tas: 10, systems: 5 }),
      player({ name: 'mid', tas: 5, systems: 5 }),
      player({ name: 'low', tas: 1, systems: 5 }),
    ]
    calculatePPA(players, false)
    const byName = Object.fromEntries(players.map((p) => [p.name, p.ppa]))
    // systems are tied across all three, so only the tas extremes move ppa
    expect(byName.high).toBe(4)
    expect(byName.mid).toBe(5)
    expect(byName.low).toBe(6)
  })

  it('stacks the penalty when a player is both the max tas and max systems', () => {
    const players = [player({ name: 'dominant', tas: 10, systems: 10 }), player({ name: 'other', tas: 1, systems: 1 })]
    calculatePPA(players, false)
    const byName = Object.fromEntries(players.map((p) => [p.name, p.ppa]))
    expect(byName.dominant).toBe(3)
    expect(byName.other).toBe(7)
  })

  it('derives tas and systems from ships/companies when syncShips is true', () => {
    const players = [
      player({
        name: 'fleet',
        ships: [
          ship({ systems: [{ class: 'internal' }, { class: 'catapult' }] }),
          ship({ systems: [{ class: 'attack', attackType: 'a' }] }),
        ],
      }),
    ]
    calculatePPA(players, true)
    // tas = ships.length (2) + mech companies (1 catapult) = 3
    expect(players[0].tas).toBe(3)
    // systems = total non-empty system entries across ships = 3
    expect(players[0].systems).toBe(3)
  })
})

describe('dice', () => {
  it('returns an empty string for a destroyed ship', () => {
    expect(dice(ship({ destroyed: true }))).toBe('')
  })

  it('falls back to 2W when the ship has no internal systems at all', () => {
    expect(dice(ship({ systems: [] }))).toBe('2W')
  })

  it('counts active internal systems instead of the 2W fallback once any internal system exists', () => {
    expect(dice(ship({ systems: [{ class: 'internal' }, { class: 'internal' }] }))).toBe('2W')
  })

  it('drops the W notation entirely when the only internal systems are disabled (no fallback, no count)', () => {
    // Characterizes an existing quirk: the 2W fallback only applies when there are zero
    // internal systems on the ship at all, not when they're all disabled.
    expect(dice(ship({ systems: [{ class: 'internal', disabled: true }] }))).toBe('')
  })

  it('appends 1G for frigates but not capitals', () => {
    expect(dice(ship({ class: 'frigate', systems: [{ class: 'internal' }] }))).toBe('1W1G')
    expect(dice(ship({ class: 'capital', systems: [{ class: 'internal' }] }))).toBe('1W')
  })

  it('notes a single catapult as 1K and multiple catapults as 3K', () => {
    expect(dice(ship({ systems: [{ class: 'internal' }, { class: 'catapult' }] }))).toBe('1W1K')
    expect(dice(ship({ systems: [{ class: 'internal' }, { class: 'catapult' }, { class: 'catapult' }] }))).toBe('1W3K')
  })

  it('counts active defense and sensor systems, excluding disabled ones', () => {
    const testShip = ship({
      systems: [
        { class: 'internal' },
        { class: 'defense' },
        { class: 'defense', disabled: true },
        { class: 'sensor' },
        { class: 'sensor' },
      ],
    })
    expect(dice(testShip)).toBe('1W1B2Y')
  })

  it('excludes disabled catapults, defense, and sensor systems from the notation', () => {
    const testShip = ship({
      systems: [
        { class: 'internal' },
        { class: 'catapult', disabled: true },
        { class: 'defense', disabled: true },
        { class: 'sensor', disabled: true },
      ],
    })
    expect(dice(testShip)).toBe('1W')
  })

  it('combines internal, class, and attack notation in order for a frigate', () => {
    expect(dice(ship({ class: 'frigate', systems: [{ class: 'internal' }, { class: 'attack', attackType: 'a' }] }))).toBe('1W1GRa2')
  })
})

describe('dice — attack notation', () => {
  it('gives an un-split attack system its full weight of 2', () => {
    const testShip = ship({ class: 'capital', systems: [{ class: 'internal' }, { class: 'attack', attackType: 'a' }] })
    expect(dice(testShip)).toBe('1WRa2')
  })

  it('splits a dual-type attack system into 1 point per attack type', () => {
    const testShip = ship({ class: 'capital', systems: [{ class: 'internal' }, { class: 'attack', attackType: 'a', attackType2: 's' }] })
    expect(dice(testShip)).toBe('1WRa1Rs1')
  })

  it('excludes disabled attack systems from the notation', () => {
    const testShip = ship({ class: 'capital', systems: [{ class: 'internal' }, { class: 'attack', attackType: 'a', disabled: true }] })
    expect(dice(testShip)).toBe('1W')
  })

  it('caps combined attack value per type at 4 and switches to the 2+d8 notation above 3', () => {
    const testShip = ship({
      class: 'capital',
      systems: [{ class: 'internal' }, { class: 'attack', attackType: 'a' }, { class: 'attack', attackType: 'a' }],
    })
    expect(dice(testShip)).toBe('1WRa2+d8')
  })
})

describe('companyDice', () => {
  function company(overrides = {}) {
    return { origin: 'Ship', systems: [], destroyed: false, outOfFuel: false, ...overrides }
  }

  it('returns an empty string when destroyed or out of fuel', () => {
    expect(companyDice(company({ destroyed: true }))).toBe('')
    expect(companyDice(company({ outOfFuel: true }))).toBe('')
  })

  it('builds notation from each active system type, excluding disabled systems', () => {
    const testCompany = company({
      systems: [
        { class: 'system' },
        { class: 'system', disabled: true },
        { class: 'weapon' },
        { class: 'defense' },
        { class: 'comm' },
        { class: 'movement' },
      ],
    })
    expect(companyDice(testCompany)).toBe('1W2Rd1B1Y1G')
  })

  it('appends an ace die keyed off the first letter of aceType', () => {
    const testCompany = company({ systems: [{ class: 'system' }], aceType: 'pilot' })
    expect(companyDice(testCompany)).toBe('1W+Pd8')
  })
})

describe('recalculate / determineRole', () => {
  it('assigns Defender to the highest total, Primary attacker to the lowest, Secondary attacker to the rest', () => {
    const players = [
      player({ name: 'a', ppa: 5, hva: 1, tas: 1 }),
      player({ name: 'b', ppa: 5, hva: 3, tas: 3 }),
      player({ name: 'c', ppa: 5, hva: 5, tas: 5 }),
    ]
    players.forEach((p) => recalculate(p, players))
    const roleByName = Object.fromEntries(players.map((p) => [p.name, p.role]))
    expect(roleByName.c).toBe('Defender')
    expect(roleByName.b).toBe('Secondary attacker')
    expect(roleByName.a).toBe('Primary attacker')
  })

  it('resolves a total tied for both the max and the min to Primary attacker', () => {
    // Characterizes an existing quirk: determineRole checks "is max" then "is min" unconditionally
    // (not else-if), so a total that's both (every player tied) ends up Primary attacker, not Defender.
    const players = [player({ name: 'a', ppa: 5, hva: 2, tas: 2 }), player({ name: 'b', ppa: 5, hva: 2, tas: 2 })]
    players.forEach((p) => recalculate(p, players))
    expect(players.every((p) => p.role === 'Primary attacker')).toBe(true)
  })

  it('computes total as ppa * (hva + tas)', () => {
    const players = [player({ ppa: 4, hva: 3, tas: 2 })]
    recalculate(players[0], players)
    expect(players[0].total).toBe(20)
  })
})

describe('battle persistence', () => {
  it('readBattles returns null when nothing has ever been stored', () => {
    expect(readBattles()).toBeNull()
  })

  it('readBattle throws when nothing has ever been stored', () => {
    // Characterizes an existing quirk: readBattle assumes readBattles() returned an object and
    // calls .hasOwnProperty on it without a null check, so it throws rather than returning null
    // when localStorage has no battles at all.
    expect(() => readBattle(123)).toThrow()
  })

  it('storeBattle persists a battle and readBattle retrieves it by the returned id', () => {
    const roster = [player({ name: 'p1', ships: [ship()] })]
    const id = storeBattle(roster, true, true)
    expect(typeof id).toBe('number')
    const battles = readBattles()
    expect(Object.keys(battles)).toEqual([String(id)])
  })

  it('readBattle returns null for an id that was never stored, once other battles exist', () => {
    const roster = [player({ name: 'p1', ships: [ship()] })]
    const id = storeBattle(roster, true, true)
    expect(readBattle(id + 1)).toBeNull()
  })

  it('re-saving with an explicit id overwrites that battle instead of creating a new one', () => {
    const roster = [player({ name: 'p1', ships: [ship()] })]
    const id = storeBattle(roster, true, true)
    roster[0].name = 'renamed'
    storeBattle(roster, true, true, id)
    expect(Object.keys(readBattles())).toHaveLength(1)
    const reread = readBattle(id)
    expect(reread.roster[0].name).toBe('renamed')
  })

  it('store() persists a battle object using its own id field', () => {
    const roster = [player({ name: 'p1', ships: [ship()] })]
    const id = storeBattle(roster, true, true)
    const battle = readBattle(id)
    battle.roster[0].name = 'via-store'
    store(battle)
    expect(readBattle(id).roster[0].name).toBe('via-store')
  })

  it('nulls out ship data and re-saves when the battle predates per-ship tracking (missing track/sync)', () => {
    const roster = [player({ name: 'p1', ships: [ship()] })]
    const id = storeBattle(roster, false, false)
    const battle = readBattle(id)
    expect(battle.roster[0].ships).toBeNull()
    // the migration re-saved the battle with the nulled-out ships, under the same id
    const reread = readBattle(id)
    expect(reread.roster[0].ships).toBeNull()
  })

  it('backfills ship internal systems, ids/owners, and mech companies on first read of old saved data', () => {
    const legacyShip = { name: 'Frigate', class: 'frigate', systems: [{ class: 'catapult' }], destroyed: false }
    const roster = [player({ name: 'p1', ships: [legacyShip] })]
    const id = storeBattle(roster, true, true)

    const battle = readBattle(id)

    const migratedPlayer = battle.roster[0]
    expect(migratedPlayer.id).toBeTruthy()
    const migratedShip = migratedPlayer.ships[0]
    expect(migratedShip.id).toBeTruthy()
    expect(migratedShip.owner).toBe(migratedPlayer.id)
    const internalCount = migratedShip.systems.filter((s) => s.class === 'internal').length
    expect(internalCount).toBe(2)

    expect(migratedPlayer.companies).toHaveLength(1)
    const companyClasses = migratedPlayer.companies[0].systems.map((s) => s.class).sort()
    expect(companyClasses).toEqual(['comm', 'defense', 'movement', 'system', 'system', 'weapon'])
    expect(migratedPlayer.companies[0].origin).toBe('Frigate')

    // the migration was persisted, so re-reading doesn't re-run it or change the data further
    const reread = readBattle(id)
    expect(reread.roster[0].ships[0].id).toBe(migratedShip.id)
    expect(reread.roster[0].companies).toHaveLength(1)
  })

  it('assigns a catapult ship carrying an ace to its backfilled company', () => {
    const legacyShip = {
      name: 'Ace Ship',
      class: 'frigate',
      systems: [{ class: 'catapult' }],
      destroyed: false,
      hasAce: true,
      aceType: 'gunner',
    }
    const roster = [player({ name: 'p1', ships: [legacyShip] })]
    const id = storeBattle(roster, true, true)

    const battle = readBattle(id)
    expect(battle.roster[0].companies[0].aceType).toBe('gunner')
  })

  it('leaves already-migrated battles untouched (no re-migration, no extra persistence)', () => {
    const legacyShip = { name: 'Frigate', class: 'frigate', systems: [{ class: 'catapult' }], destroyed: false }
    const roster = [player({ name: 'p1', ships: [legacyShip] })]
    const id = storeBattle(roster, true, true)
    readBattle(id) // runs the migration once

    const rawAfterMigration = localStorage.getItem('mf0-battles')
    readBattle(id) // should be a no-op now
    expect(localStorage.getItem('mf0-battles')).toBe(rawAfterMigration)
  })
})
