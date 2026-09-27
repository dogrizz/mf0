const BATTLE_ID_PARAM = 'battleId'

const ShipSystem = {
  INTERNAL: 'internal',
  ATTACK: 'attack',
  DEFENSE: 'defense',
  SENSOR: 'sensor',
  CATAPULT: 'catapult',
}

const AttackType = {
  POINT_DEFENSE: 'p',
  ASSAULT: 'a',
  SUPPORT: 's',
}

const ShipType = {
  FRIGATE: 'frigate',
  CAPITAL: 'capital',
}

const MAX_SYSTEMS = {
  [ShipType.CAPITAL]: 4,
  [ShipType.FRIGATE]: 3,
}

const MechSystem = {
  SYSTEM: 'system',
  WEAPON: 'weapon',
  DEFENSE: 'defense',
  COMMS: 'comm',
  MOVEMENT: 'movement',
}

// Scores the part of a ship's dice notation that's identical whether the ship is builder-shaped
// or battle-shaped (frigate movement die, catapults, defense, sensors, attack) - shared by
// support/builder.js's builderDice and support/battle.js's battleDice. Internal ("W") systems are
// scored separately by each of those, since the two domains represent internals differently (see
// CONTEXT.md's "Builder-shaped"/"Battle-shaped ship").
function shipSystemsDice(ship) {
  let diceDescription = ''
  if (ship.hasOwnProperty('class') && ship.class === ShipType.FRIGATE) {
    diceDescription += '1G'
  }
  if (!ship.hasOwnProperty('systems')) {
    return diceDescription
  }

  var catapults = ship.systems.filter(function (system) {
    return system.class === ShipSystem.CATAPULT && !system.disabled
  }).length
  if (catapults == 1) {
    diceDescription += '1K'
  }
  if (catapults > 1) {
    diceDescription += '3K'
  }

  var defence = ship.systems.filter(function (system) {
    return system.class === ShipSystem.DEFENSE && !system.disabled
  }).length
  if (defence) {
    diceDescription = `${diceDescription}${defence}B`
  }

  var sensors = ship.systems.filter(function (system) {
    return system.class === ShipSystem.SENSOR && !system.disabled
  }).length
  if (sensors) {
    diceDescription = `${diceDescription}${sensors}Y`
  }

  var attack = ship.systems.filter(function (system) {
    return system.class === ShipSystem.ATTACK && !system.disabled
  })
  var attacks = {
    p: [],
    a: [],
    s: [],
  }
  attack.forEach(function (att) {
    if (att.hasOwnProperty('attackType2')) {
      attacks[att.attackType].push({ val: 1 })
      attacks[att.attackType2].push({ val: 1 })
    } else {
      attacks[att.attackType].push({ val: 2 })
    }
  })

  var atts = Object.entries(attacks)
  atts.forEach(function (att) {
    var val = att[1]
      .sort()
      .slice(0, 2)
      .map((att) => att.val)
      .reduce((a, b) => a + b, 0)
    if (val) {
      var dice = val <= 3 ? val : '2+d8'
      diceDescription = `${diceDescription}R${att[0]}${dice}`
    }
  })

  return diceDescription
}
