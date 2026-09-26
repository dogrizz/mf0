import { beforeEach, describe, expect, it } from 'vitest'
import { loadSupport } from './helpers/load-support.js'

const {
  ShipSystem,
  AttackType,
  MechSystem,
  calculatePPA,
  dice,
  companyDice,
  recalculate,
  determineRole,
  storeBattle,
  readBattle,
  readBattles,
  store,
} = loadSupport()

function makePlayer(overrides = {}) {
  return {
    name: 'Player',
    hva: 0,
    tas: 0,
    systems: 0,
    ppa: 5,
    total: 0,
    role: '',
    ships: [],
    companies: [],
    ...overrides,
  }
}

function makeShip(overrides = {}) {
  return {
    name: 'Ship',
    class: 'capital',
    systems: [],
    destroyed: false,
    ...overrides,
  }
}

function makeSystem(klass, extra = {}) {
  return { class: klass, disabled: false, ...extra }
}

describe('calculatePPA', () => {
  it('does nothing for an empty roster', () => {
    expect(calculatePPA([], false)).toBeUndefined()
  })

  it('leaves ppa at 5 when every player ties on tas and systems', () => {
    const players = [makePlayer({ tas: 3, systems: 3 }), makePlayer({ tas: 3, systems: 3 }), makePlayer({ tas: 3, systems: 3 })]

    calculatePPA(players, false)

    expect(players.map((p) => p.ppa)).toEqual([5, 5, 5])
  })

  it('penalizes max tas and rewards min tas, holding systems equal', () => {
    const high = makePlayer({ tas: 5, systems: 2 })
    const mid = makePlayer({ tas: 3, systems: 2 })
    const low = makePlayer({ tas: 1, systems: 2 })

    calculatePPA([high, mid, low], false)

    expect(high.ppa).toBe(4)
    expect(mid.ppa).toBe(5)
    expect(low.ppa).toBe(6)
  })

  it('penalizes max systems and rewards min systems, holding tas equal', () => {
    const high = makePlayer({ tas: 2, systems: 6 })
    const mid = makePlayer({ tas: 2, systems: 4 })
    const low = makePlayer({ tas: 2, systems: 2 })

    calculatePPA([high, mid, low], false)

    expect(high.ppa).toBe(4)
    expect(mid.ppa).toBe(5)
    expect(low.ppa).toBe(6)
  })

  it('stacks tas and systems adjustments for a player at both extremes', () => {
    const worst = makePlayer({ tas: 5, systems: 6 })
    const mid = makePlayer({ tas: 3, systems: 4 })
    const best = makePlayer({ tas: 1, systems: 2 })

    calculatePPA([worst, mid, best], false)

    expect(worst.ppa).toBe(3)
    expect(mid.ppa).toBe(5)
    expect(best.ppa).toBe(7)
  })

  it('recomputes tas/systems from ships when syncShips is true', () => {
    const player = makePlayer({
      tas: 999,
      systems: 999,
      ships: [
        makeShip({ systems: [makeSystem(ShipSystem.CATAPULT), makeSystem(ShipSystem.INTERNAL)] }),
        makeShip({ systems: [makeSystem(ShipSystem.SENSOR)] }),
      ],
    })

    calculatePPA([player], true)

    // 2 ships + 1 catapult-derived mech company = 3 tas; 3 non-empty-class systems total
    expect(player.tas).toBe(3)
    expect(player.systems).toBe(3)
  })

  it('leaves the given tas/systems untouched when syncShips is false, even with ships present', () => {
    const player = makePlayer({
      tas: 7,
      systems: 9,
      ships: [makeShip({ systems: [makeSystem(ShipSystem.CATAPULT)] })],
    })

    calculatePPA([player], false)

    expect(player.tas).toBe(7)
    expect(player.systems).toBe(9)
  })
})

describe('dice', () => {
  it('returns an empty string for a destroyed ship', () => {
    expect(dice(makeShip({ destroyed: true }))).toBe('')
  })

  it('falls back to a flat 2W when the ship has no internal systems at all', () => {
    expect(dice(makeShip({ class: 'capital', systems: [] }))).toBe('2W')
  })

  it('counts active internal systems instead of the 2W fallback once any internal system exists', () => {
    const ship = makeShip({
      class: 'capital',
      systems: [makeSystem(ShipSystem.INTERNAL), makeSystem(ShipSystem.INTERNAL), makeSystem(ShipSystem.INTERNAL)],
    })

    expect(dice(ship)).toBe('3W')
  })

  it('excludes disabled internal systems from the count', () => {
    const ship = makeShip({
      class: 'capital',
      systems: [makeSystem(ShipSystem.INTERNAL), makeSystem(ShipSystem.INTERNAL, { disabled: true })],
    })

    expect(dice(ship)).toBe('1W')
  })

  it('omits the W component entirely when every internal system is disabled', () => {
    const ship = makeShip({ class: 'capital', systems: [makeSystem(ShipSystem.INTERNAL, { disabled: true })] })

    expect(dice(ship)).toBe('')
  })

  it('adds 1G for a frigate hull', () => {
    const ship = makeShip({ class: 'frigate', systems: [] })

    expect(dice(ship)).toBe('2W1G')
  })

  it('renders a single active catapult as 1K and multiple as 3K, excluding disabled ones', () => {
    const oneCatapult = makeShip({ systems: [makeSystem(ShipSystem.CATAPULT)] })
    const twoCatapults = makeShip({ systems: [makeSystem(ShipSystem.CATAPULT), makeSystem(ShipSystem.CATAPULT)] })
    const disabledCatapult = makeShip({ systems: [makeSystem(ShipSystem.CATAPULT, { disabled: true })] })

    expect(dice(oneCatapult)).toContain('1K')
    expect(dice(twoCatapults)).toContain('3K')
    expect(dice(disabledCatapult)).not.toContain('K')
  })

  it('counts active defense and sensor systems, excluding disabled ones', () => {
    const ship = makeShip({
      systems: [
        makeSystem(ShipSystem.INTERNAL, { disabled: true }),
        makeSystem(ShipSystem.DEFENSE),
        makeSystem(ShipSystem.DEFENSE, { disabled: true }),
        makeSystem(ShipSystem.SENSOR),
      ],
    })

    expect(dice(ship)).toBe('1B1Y')
  })

  it('renders a single-type attack system as Rp2', () => {
    const ship = makeShip({
      systems: [
        makeSystem(ShipSystem.INTERNAL, { disabled: true }),
        makeSystem(ShipSystem.ATTACK, { attackType: AttackType.POINT_DEFENSE }),
      ],
    })

    expect(dice(ship)).toBe('Rp2')
  })

  it('escalates to a d8 attack once the summed value for a type exceeds 3', () => {
    const ship = makeShip({
      systems: [
        makeSystem(ShipSystem.INTERNAL, { disabled: true }),
        makeSystem(ShipSystem.ATTACK, { attackType: AttackType.POINT_DEFENSE }),
        makeSystem(ShipSystem.ATTACK, { attackType: AttackType.POINT_DEFENSE }),
      ],
    })

    expect(dice(ship)).toBe('Rp2+d8')
  })

  it('splits a dual-type attack system across both attack types at half value', () => {
    const ship = makeShip({
      systems: [makeSystem(ShipSystem.ATTACK, { attackType: AttackType.POINT_DEFENSE, attackType2: AttackType.ASSAULT })],
    })

    const result = dice(ship)
    expect(result).toContain('Rp1')
    expect(result).toContain('Ra1')
  })

  it('excludes disabled attack systems from the notation', () => {
    const ship = makeShip({ systems: [makeSystem(ShipSystem.ATTACK, { attackType: AttackType.POINT_DEFENSE, disabled: true })] })

    expect(dice(ship)).not.toContain('R')
  })

  it('assembles a full frigate loadout in the documented order', () => {
    const ship = makeShip({
      class: 'frigate',
      systems: [
        makeSystem(ShipSystem.INTERNAL),
        makeSystem(ShipSystem.INTERNAL),
        makeSystem(ShipSystem.ATTACK, { attackType: AttackType.POINT_DEFENSE }),
      ],
    })

    expect(dice(ship)).toBe('2W1GRp2')
  })
})

describe('companyDice', () => {
  function makeCompany(overrides = {}) {
    return { origin: 'Ship', systems: [], destroyed: false, outOfFuel: false, ...overrides }
  }

  it('returns an empty string when destroyed', () => {
    expect(companyDice(makeCompany({ destroyed: true, systems: [makeSystem(MechSystem.SYSTEM)] }))).toBe('')
  })

  it('returns an empty string when out of fuel', () => {
    expect(companyDice(makeCompany({ outOfFuel: true, systems: [makeSystem(MechSystem.SYSTEM)] }))).toBe('')
  })

  it('counts active internal systems, excluding disabled ones', () => {
    const company = makeCompany({
      systems: [makeSystem(MechSystem.SYSTEM), makeSystem(MechSystem.SYSTEM), makeSystem(MechSystem.SYSTEM, { disabled: true })],
    })

    expect(companyDice(company)).toBe('2W')
  })

  it('contributes a flat 2Rd for weapons regardless of how many are active', () => {
    const oneWeapon = makeCompany({ systems: [makeSystem(MechSystem.WEAPON)] })
    const twoWeapons = makeCompany({ systems: [makeSystem(MechSystem.WEAPON), makeSystem(MechSystem.WEAPON)] })

    expect(companyDice(oneWeapon)).toBe('2Rd')
    expect(companyDice(twoWeapons)).toBe('2Rd')
  })

  it('excludes a disabled weapon system entirely', () => {
    const company = makeCompany({ systems: [makeSystem(MechSystem.WEAPON, { disabled: true })] })

    expect(companyDice(company)).toBe('')
  })

  it('counts active defense, comms, and movement systems', () => {
    const company = makeCompany({
      systems: [makeSystem(MechSystem.DEFENSE), makeSystem(MechSystem.COMMS), makeSystem(MechSystem.MOVEMENT)],
    })

    expect(companyDice(company)).toBe('1B1Y1G')
  })

  it('appends an ace bonus using the uppercased first letter of the ace type', () => {
    const company = makeCompany({ systems: [makeSystem(MechSystem.SYSTEM)], aceType: 'veteran' })

    expect(companyDice(company)).toBe('1W+Vd8')
  })
})

describe('recalculate / determineRole', () => {
  it('sets total from ppa * (hva + tas) and reassigns roles across the roster', () => {
    const attacker = makePlayer({ ppa: 4, hva: 1, tas: 1, total: 5, role: 'Defender' })
    const target = makePlayer({ ppa: 5, hva: 2, tas: 1, total: 100, role: '' })

    recalculate(target, [attacker, target])

    expect(target.total).toBe(15)
    expect(target.role).toBe('Defender')
    expect(attacker.role).toBe('Primary attacker')
  })

  it('assigns Defender to the highest total, Primary attacker to the lowest, and Secondary to the rest', () => {
    const high = makePlayer({ total: 30 })
    const mid = makePlayer({ total: 20 })
    const low = makePlayer({ total: 10 })

    determineRole([high, mid, low])

    expect(high.role).toBe('Defender')
    expect(mid.role).toBe('Secondary attacker')
    expect(low.role).toBe('Primary attacker')
  })

  it('assigns Defender to every player tied for the highest total when a distinct low exists', () => {
    const tiedA = makePlayer({ total: 20 })
    const tiedB = makePlayer({ total: 20 })
    const low = makePlayer({ total: 5 })

    determineRole([tiedA, tiedB, low])

    expect(tiedA.role).toBe('Defender')
    expect(tiedB.role).toBe('Defender')
    expect(low.role).toBe('Primary attacker')
  })

  it('resolves a single-player roster to Primary attacker, since it is simultaneously the max and min total', () => {
    const solo = makePlayer({ total: 42 })

    determineRole([solo])

    expect(solo.role).toBe('Primary attacker')
  })
})

describe('battle persistence (storeBattle / readBattle / readBattles / store)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null from readBattles when nothing has been stored', () => {
    expect(readBattles()).toBeNull()
  })

  it('returns null from readBattle when a battle exists but the requested id does not', () => {
    storeBattle([makePlayer()], true, true, 1)

    expect(readBattle(999999)).toBeNull()
  })

  // Existing behavior, left as-is per the migration's "domain logic unchanged" scope: readBattles()
  // returns null (not {}) when nothing has ever been stored, and readBattle() unconditionally calls
  // .hasOwnProperty on that result, so it throws rather than returning null in this specific case.
  it('throws when no battle has ever been stored, since readBattles() returns null in that case', () => {
    expect(() => readBattle(123456)).toThrow()
  })

  it('round-trips a stored battle through readBattles', () => {
    const roster = [makePlayer({ name: 'Alice' })]
    const id = storeBattle(roster, true, true)

    const battles = readBattles()

    expect(battles).toHaveProperty(String(id))
    expect(battles[id]).toHaveProperty('date')
  })

  it('reuses an explicitly given id instead of hashing the data', () => {
    const id = storeBattle([makePlayer()], true, true, 4242)

    expect(id).toBe(4242)
    expect(readBattles()).toHaveProperty('4242')
  })

  it('updates data in place on a re-store but preserves the original stored date', () => {
    const id = storeBattle([makePlayer({ name: 'Alice' })], true, true)
    const originalDate = readBattles()[id].date

    storeBattle([makePlayer({ name: 'Bob' })], true, true, id)

    expect(readBattles()[id].date).toBe(originalDate)
  })

  it('store() delegates to storeBattle using the battle object shape', () => {
    const id = storeBattle([makePlayer({ name: 'Alice' })], true, true)
    const battle = { roster: [makePlayer({ name: 'Alice-updated' })], track: true, sync: true, id }

    store(battle)

    const reread = readBattle(id)
    expect(reread.roster[0].name).toBe('Alice-updated')
  })

  it('backfills a missing battle.id from the lookup key on read', () => {
    const id = storeBattle([makePlayer()], true, true)

    const battle = readBattle(id)

    expect(battle.id).toBe(id)
  })

  it('nulls out ship rosters on read for battles stored without per-ship tracking', () => {
    const id = storeBattle([makePlayer({ ships: [makeShip()] })], false, true)

    const battle = readBattle(id)

    expect(battle.roster[0].ships).toBeNull()
  })

  it('lazily backfills internal systems and builds mech companies for old data missing them', () => {
    const oldShip = makeShip({ systems: [makeSystem(ShipSystem.CATAPULT)] })
    // Old saved data predates the `companies` field entirely, so the fixture omits it (unlike
    // makePlayer()'s default) — its presence is exactly what alreadySetUpCompanies() checks for.
    const oldPlayer = { name: 'Player', hva: 0, tas: 0, systems: 0, ppa: 5, total: 0, role: '', ships: [oldShip] }
    const id = storeBattle([oldPlayer], true, true)

    const battle = readBattle(id)

    const migratedShip = battle.roster[0].ships[0]
    const internalCount = migratedShip.systems.filter((s) => s.class === ShipSystem.INTERNAL).length
    expect(internalCount).toBe(2)
    expect(migratedShip.id).toBeTruthy()
    expect(migratedShip.owner).toBe(battle.roster[0].id)

    expect(battle.roster[0].companies).toHaveLength(1)
    const companyClasses = battle.roster[0].companies[0].systems.map((s) => s.class).sort()
    expect(companyClasses).toEqual(
      [MechSystem.COMMS, MechSystem.DEFENSE, MechSystem.MOVEMENT, MechSystem.SYSTEM, MechSystem.SYSTEM, MechSystem.WEAPON].sort(),
    )
  })

  it('does not re-add internals or duplicate companies on a second read of already-migrated data', () => {
    const oldShip = makeShip({ systems: [makeSystem(ShipSystem.CATAPULT)] })
    const oldPlayer = { name: 'Player', hva: 0, tas: 0, systems: 0, ppa: 5, total: 0, role: '', ships: [oldShip] }
    const id = storeBattle([oldPlayer], true, true)

    readBattle(id)
    const secondRead = readBattle(id)

    const ship = secondRead.roster[0].ships[0]
    const internalCount = ship.systems.filter((s) => s.class === ShipSystem.INTERNAL).length
    expect(internalCount).toBe(2)
    expect(secondRead.roster[0].companies).toHaveLength(1)
  })
})
