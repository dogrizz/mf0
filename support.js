function calculate() {
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
  var diceDescription = '2W'
  if (ship.hasOwnProperty('class') && ship.class === 'frigate') {
    diceDescription += '1G'
  }
  if (ship.hasOwnProperty('systems')) {
    var catapults = ship.systems.filter(function (system) {
      return system.class === 'catapult'
    }).length
    if (catapults == 1) {
      diceDescription += '1K'
    }
    if (catapults > 1) {
      diceDescription += '3K'
    }

    var defence = ship.systems.filter(function (system) {
      return system.class === 'defence'
    }).length
    if (defence) {
      diceDescription = `${diceDescription}${defence}B`
    }

    var sensors = ship.systems.filter(function (system) {
      return system.class === 'sensor'
    }).length
    if (sensors) {
      diceDescription = `${diceDescription}${sensors}Y`
    }

    var attack = ship.systems.filter(function (system) {
      return system.class === 'attack'
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
