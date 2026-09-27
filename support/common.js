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

// Presentation constant, not game domain data - confirmed during the redesign code-review
// cleanup (.scratch/tactical-redesign/issues/04-redesign-code-review-cleanup.md) as belonging
// here rather than a page-specific file, same as FLEET_ACCENT_COLORS below: both are label/color
// maps shared by more than one page (builder's system-slot dropdown and the battle tracker's
// per-system labels - see battle/components/vue-battle-ship.js's systemText), not logic, so
// they're harmless in a domain file and don't warrant their own shared-constants module for two
// entries.
const ATTACK_TYPE_LABELS = {
  [AttackType.POINT_DEFENSE]: 'Point Defense',
  [AttackType.ASSAULT]: 'Assault',
  [AttackType.SUPPORT]: 'Support',
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

// Presentation constant, not game domain data - lives here (rather than a page-specific file)
// because it's loaded by all three pages and the tactical redesign (see
// .scratch/tactical-redesign/spec.md) assigns fleet identity colors consistently across all of
// them, cycling once a battle/fleet-builder session has more fleets than colors.
const FLEET_ACCENT_COLORS = ['#f2a154', '#4fb0e0', '#9c8cf0']

function fleetAccentColor(rosterIndex) {
  return FLEET_ACCENT_COLORS[rosterIndex % FLEET_ACCENT_COLORS.length]
}

// Letter -> color-name map for dice-notation chips (see .scratch/dice-notation-colors/spec.md).
// The color names double as the '.dice-<color>' CSS class suffix in style.css.
const DICE_COLORS = {
  W: 'white',
  G: 'green',
  K: 'black',
  B: 'blue',
  Y: 'yellow',
  R: 'red',
}

// Wraps a dice-notation piece (e.g. '1G') with the color its leading die letter maps to, for
// rendering as a `.dice-<color>` span instead of plain text.
function diceSegment(text, letterKey) {
  return { text: text, color: DICE_COLORS[letterKey] }
}

// Scores the part of a ship's dice notation that's identical whether the ship is builder-shaped
// or battle-shaped (frigate movement die, catapults, defense, sensors, attack) - shared by
// support/builder.js's builderDice and support/battle.js's battleDice. Internal ("W") systems are
// scored separately by each of those, since the two domains represent internals differently (see
// CONTEXT.md's "Builder-shaped"/"Battle-shaped ship").
function shipSystemsDice(ship) {
  var segments = []
  if (ship.hasOwnProperty('class') && ship.class === ShipType.FRIGATE) {
    segments.push(diceSegment('1G', 'G'))
  }
  if (!ship.hasOwnProperty('systems')) {
    return segments
  }

  var catapults = ship.systems.filter(function (system) {
    return system.class === ShipSystem.CATAPULT && !system.disabled
  }).length
  if (catapults == 1) {
    segments.push(diceSegment('1K', 'K'))
  }
  if (catapults > 1) {
    segments.push(diceSegment('3K', 'K'))
  }

  var defence = ship.systems.filter(function (system) {
    return system.class === ShipSystem.DEFENSE && !system.disabled
  }).length
  if (defence) {
    segments.push(diceSegment(`${defence}B`, 'B'))
  }

  var sensors = ship.systems.filter(function (system) {
    return system.class === ShipSystem.SENSOR && !system.disabled
  }).length
  if (sensors) {
    segments.push(diceSegment(`${sensors}Y`, 'Y'))
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
      segments.push(diceSegment(`${dice}R${att[0]}`, 'R'))
    }
  })

  return segments
}
