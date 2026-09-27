function calculatePPA(players, syncShips) {
  if (players.length === 0) {
    return
  }
  players.forEach(function (player) {
    player.ppa = 5
  })
  if (syncShips) {
    players.forEach(function (player) {
      player.tas = player.ships.length + countMechCompanies(player.ships)
      player.systems = countSystems(player.ships)
    })
  }
  var playersSorted = [...players].sort(function (a, b) {
    return b.tas - a.tas
  })
  var maxTas = parseInt(playersSorted[0].tas)
  var minTas = parseInt(playersSorted[playersSorted.length - 1].tas)

  playersSorted.sort(function (a, b) {
    return b.systems - a.systems
  })
  var maxSystems = parseInt(playersSorted[0].systems)
  var minSystems = parseInt(playersSorted[playersSorted.length - 1].systems)

  players.forEach(function (player) {
    if (parseInt(player.tas) == maxTas) {
      player.ppa = player.ppa - 1
    }
    if (parseInt(player.tas) == minTas) {
      player.ppa = player.ppa + 1
    }
    if (parseInt(player.systems) == maxSystems) {
      player.ppa = player.ppa - 1
    }
    if (parseInt(player.systems) == minSystems) {
      player.ppa = player.ppa + 1
    }
  })
  // Same PPA*(HVA+TAs) formula as support/battle.js's recalculate - the builder doesn't need
  // determineRole's Defender/attacker assignment, just the shared total.
  players.forEach(function (player) {
    player.total = player.ppa * (player.hva + player.tas)
  })
}

function countMechCompanies(ships) {
  var companies = 0
  ships.forEach(function (ship) {
    ship.systems.forEach(function (system) {
      if (system.class === ShipSystem.CATAPULT) {
        companies = companies + 1
      }
    })
  })
  return companies
}

function countSystems(ships) {
  var systems = 0
  ships.forEach(function (ship) {
    ship.systems.forEach(function (system) {
      if (system.class != null && system.class !== '') {
        systems = systems + 1
      }
    })
  })
  return systems
}

// Builder-domain dice notation: the fleet builder never tracks individual internal systems (see
// CONTEXT.md's "Internal system"), so a ship's wound capacity always shows the 2W baseline rather
// than counting real systems the way support/battle.js's battleDice does.
function builderDice(ship) {
  if (ship.destroyed) {
    return []
  }
  return [diceSegment('2W', 'W')].concat(shipSystemsDice(ship))
}

function copy(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function setSystemAttackType(system, newType) {
  system.attackType = newType
}

function setSystemSecondAttackType(system, newType) {
  system.attackType2 = newType
}

function clearSystemSecondAttackType(system) {
  delete system.attackType2
}

function setSystemClass(system, newClass) {
  system.class = newClass
  if (system.class === ShipSystem.ATTACK) {
    setSystemAttackType(system, AttackType.POINT_DEFENSE)
  }
}

function setShipClass(ship, newClass) {
  if (ship.class === newClass) {
    return false
  }
  ship.class = newClass
  ship.systems = []
  var systemsCount = MAX_SYSTEMS.hasOwnProperty(newClass) ? MAX_SYSTEMS[newClass] : 0
  for (var i = 0; i < systemsCount; i++) {
    ship.systems.push({ class: '' })
  }
  return true
}

function removeShip(fleet, ship) {
  var position = fleet.ships.indexOf(ship)
  fleet.ships.splice(position, 1)
  if (ship.hasAce) {
    fleet.aceSelected = false
  }
}

function duplicateShip(fleet, ship) {
  var position = fleet.ships.indexOf(ship)
  fleet.ships.splice(position, 0, copy(ship))
  if (ship.hasAce) {
    ship.hasAce = false
    delete ship.aceType
  }
}

function setShipAce(ship, fleet, hasAce) {
  ship.hasAce = hasAce
  fleet.aceSelected = hasAce
  if (!hasAce) {
    delete ship.aceType
  }
}

function setShipAceType(ship, newType) {
  ship.aceType = newType
}

function migrateFleetShips(fleet) {
  if (!fleet.hasOwnProperty('ships')) {
    fleet.ships = []
    for (var i = 0; i < fleet.tas; i++) {
      fleet.ships.push({})
    }
  }
}

function addShip(fleet) {
  fleet.ships.push({ systems: [] })
}

function randomShipName() {
  return shipNames[Math.floor(Math.random() * shipNames.length)]
}

const shipNames = [
  'Civilization',
  'Victoria',
  'Determination',
  'Trafalgar',
  'Cydonia',
  'SS Patience',
  'STS Firebrand',
  'CS Titan',
  'CS Badger',
  'SSE The Kraken',
  'Shirley',
  'Commissioner',
  'Lucky',
  'Agememnon',
  'Avenger',
  'BS Hummingbird',
  'HWSS Saber',
  'BC Nightfall',
  'HMS Jellyfish',
  'BC Leviathan',
  'Warspite',
  'Lightning',
  'Thunder',
  'Venator',
  'Enterprise',
  'Galctica',
  'Ironclad',
  'Valkyrie',
  'HMS Intrepid',
  'CS Meridian',
  'Wayfarer',
  'BC Ravager',
  'STS Hyperion',
  'Resolute',
  'Stormcaller',
  'SSE Nomad',
]
