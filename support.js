const BATTLE_STORAGE_KEY = 'mf0-battles'
const BATTLE_ID_PARAM = 'battleId'

function calculatePPA(players, syncShips) {
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
}

function dice(ship) {
  if(ship.destroyed){
    return ''
  }
  let diceDescription = ''
  if (!hasInternals(ship)) {
    diceDescription = '2W'
  } else {
    var internals = ship.systems.filter(function (system) {
      return system.class === 'internal' && !system.disabled
    }).length
    if (internals) {
      diceDescription = `${diceDescription}${internals}W`
    }
  }
  if (ship.hasOwnProperty('class') && ship.class === 'frigate') {
    diceDescription += '1G'
  }
  if (ship.hasOwnProperty('systems')) {
    var catapults = ship.systems.filter(function (system) {
      return system.class === 'catapult' && !system.disabled
    }).length
    if (catapults == 1) {
      diceDescription += '1K'
    }
    if (catapults > 1) {
      diceDescription += '3K'
    }

    var defence = ship.systems.filter(function (system) {
      return system.class === 'defence' && !system.disabled
    }).length
    if (defence) {
      diceDescription = `${diceDescription}${defence}B`
    }

    var sensors = ship.systems.filter(function (system) {
      return system.class === 'sensor' && !system.disabled
    }).length
    if (sensors) {
      diceDescription = `${diceDescription}${sensors}Y`
    }

    var attack = ship.systems.filter(function (system) {
      return system.class === 'attack' && !system.disabled
    })
    var attacks = {
      p: 0,
      a: 0,
      s: 0,
    }
    attack.forEach(function (att) {
      if (att.hasOwnProperty('attackType2')) {
        attacks[att.attackType] += 1
        attacks[att.attackType2] += 1
      } else {
        attacks[att.attackType] += 2
      }
    })

    var atts = Object.entries(attacks)
    atts.forEach(function (att) {
      var val = att[1]
      if (val) {
        var dice = val <= 3 ? val : '2+d8'
        diceDescription = `${diceDescription}R${att[0]}${dice}`
      }
    })
  }

  return diceDescription
}

function countMechCompanies(ships) {
  var companies = 0
  ships.forEach(function (ship) {
    ship.systems.forEach(function (system) {
      if (system.class === 'catapult') {
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

function hash(str) {
  return str.split('').reduce((prev, curr) => (Math.imul(31, prev) + curr.charCodeAt(0)) | 0, 0)
}

function storeBattle(roster, trackShips, syncShips, id) {
  const oldData = localStorage.getItem(BATTLE_STORAGE_KEY)
  let data = JSON.stringify({ roster: roster, track: trackShips, sync: syncShips })
  let hashed = hash(data)
  if (id) {
    hashed = id
  }
  data = LZString.compress(data)
  let battles = {}
  if (oldData !== null) {
    battles = JSON.parse(oldData)
  }
  if (battles[hashed]) {
    battles[hashed].data = data
  } else {
    battles[hashed] = { data: data, date: Date.now() }
  }
  localStorage.setItem(BATTLE_STORAGE_KEY, JSON.stringify(battles))
  return hashed
}

function readBattle(id) {
  const _id = parseInt(id)
  const battles = localStorage.getItem(BATTLE_STORAGE_KEY)
  if (battles === null) {
    return null
  }
  const readBattles = JSON.parse(battles)
  if (readBattles.hasOwnProperty(_id)) {
    const decompressed = LZString.decompress(readBattles[_id].data)
    const battle = JSON.parse(decompressed)
    if (!battle.track || !battle.sync) {
      battle.roster.forEach(function (player) {
        player.ships = null
      })
      storeBattle(battle)
    } else {
      if (!alreadyAddedInternals(battle)) {
        battle.roster.forEach((player) =>
          player.ships.forEach((ship) => {
            ship.systems.push({ class: 'internal' })
            ship.systems.push({ class: 'internal' })
            ship.systems = ship.systems.filter((system) => system.class)
            ship.systems = [...ship.systems].sort()
          }),
        )
      }
      if (!alreadySetUpCompanies(battle)) {
        battle.roster.forEach((player) => buildCompanyData(player))
        storeBattle(battle)
      }
    }
    battle.id = _id
    return battle
  }
  return null
}

function alreadyAddedInternals(battle) {
  return battle.roster.some((player) => player.ships.some((ship) => hasInternals(ship)))
}

function hasInternals(ship) {
  return ship.systems.some((system) => system.class === 'internal')
}

function alreadySetUpCompanies(battle) {
  return battle.roster.some((player) => player.hasOwnProperty('companies'))
}

function buildCompanyData(player) {
  player.companies = []
  player.ships.forEach(function (ship) {
    ship.systems.forEach(function (system) {
      if (system.class === 'catapult') {
        const company = {
          origin: ship.name,
          systems: [],
        }
        player.companies.push(company)
      }
    })
    if (ship.hasAce) {
      player.companies[player.companies.length - 1].aceType = ship.aceType
    }
  })
}

function copy(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function recalculate(player, players) {
  player.total = player.ppa * (player.hva + player.tas)
  determineRole(players)
}

function determineRole(players) {
  const playersSorted = [...players].sort(function (a, b) {
    return b.total - a.total
  })
  const playersNumber = players.length
  players.forEach((player) => (player.role = ''))
  players.forEach((player) => {
    if (player.total === playersSorted[0].total) {
      player.role = 'Defender'
    }
    if (player.total === playersSorted[playersNumber - 1].total) {
      player.role = 'Primary attacker'
    }
  })
  players.forEach((player) => {
    if (player.role === '') {
      player.role = 'Secondary attacker'
    }
  })
}