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
