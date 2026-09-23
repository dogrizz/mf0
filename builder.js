const LOCAL_STORAGE_KEY = 'mf0-tools'

function generateKey() {
  return self.crypto.randomUUID()
}

document.addEventListener('alpine:init', () => {
  Alpine.store('builder', {
    players: [],
    trackShips: false,
    syncShips: false,

    init() {
      const oldData = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (oldData !== null) {
        const data = JSON.parse(oldData)
        this.players = data.players
        this.syncShips = data.sync
        this.trackShips = data.track
        this.players.forEach((player) => {
          if (!player._key) player._key = generateKey()
        })
      }
    },

    recalculatePPA() {
      calculatePPA(this.players, this.syncShips)
      this.saveState()
    },

    saveState() {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ players: this.players, track: this.trackShips, sync: this.syncShips }))
    },

    addPlayer() {
      this.players.push({ _key: generateKey(), name: 'Player', hva: 3, tas: 5, systems: 10, ppa: 5, ships: [] })
      this.recalculatePPA()
    },

    setTrackShips(newTrackShips) {
      this.trackShips = newTrackShips
      if (!this.trackShips) {
        this.syncShips = false
      }
    },

    setSyncShips(newSyncShips) {
      this.syncShips = newSyncShips
      this.recalculatePPA()
    },

    fight() {
      location.href = 'battle.html?' + BATTLE_ID_PARAM + '=' + storeBattle(this.players, this.trackShips, this.syncShips)
    },
  })

  Alpine.data('playerComponent', (player) => ({
    player,

    changeName(newName) {
      this.player.name = newName
      this.$store.builder.saveState()
    },

    changeHva(newHva) {
      this.player.hva = parseInt(newHva)
      this.$store.builder.recalculatePPA()
    },

    changeTas(newTas) {
      this.player.tas = parseInt(newTas)
      this.$store.builder.recalculatePPA()
    },

    changeSystems(newSystems) {
      this.player.systems = parseInt(newSystems)
      this.$store.builder.recalculatePPA()
    },

    remove() {
      const position = this.$store.builder.players.indexOf(this.player)
      this.$store.builder.players.splice(position, 1)
      this.$store.builder.recalculatePPA()
    },
  }))

  Alpine.data('fleetComponent', (fleet) => ({
    fleet,

    init() {
      if (!this.fleet.hasOwnProperty('ships')) {
        this.fleet.ships = []
        for (let i = 0; i < this.fleet.tas; i++) {
          this.fleet.ships.push({ _key: generateKey() })
        }
      } else {
        this.fleet.ships.forEach((ship) => {
          if (!ship._key) ship._key = generateKey()
        })
      }
    },

    addShip() {
      this.fleet.ships.push({ _key: generateKey(), systems: [] })
      this.$store.builder.recalculatePPA()
    },
  }))

  Alpine.data('shipComponent', (ship, fleet) => ({
    ship,
    fleet,

    init() {
      if (!this.ship.class) {
        this.ship.name = randomShipName()
        this.changeClass(ShipType.FRIGATE)
      } else if (this.ship.hasOwnProperty('systems')) {
        this.ship.systems.forEach((system) => {
          if (!system._key) system._key = generateKey()
        })
      }
    },

    get dice() {
      return dice(this.ship)
    },

    get catapults() {
      return this.ship.hasOwnProperty('systems') ? this.ship.systems.filter((s) => s.class === ShipSystem.CATAPULT) : []
    },

    changeName(newName) {
      this.ship.name = newName
      this.$store.builder.saveState()
    },

    changeClass(newClass) {
      if (this.ship.class !== newClass) {
        this.ship.class = newClass
        this.ship.systems = []
        const systems = MAX_SYSTEMS.hasOwnProperty(newClass) ? MAX_SYSTEMS[newClass] : 0
        for (let i = 0; i < systems; i++) {
          this.ship.systems.push({ _key: generateKey(), class: '' })
        }
        this.$store.builder.saveState()
      }
    },

    remove() {
      const position = this.fleet.ships.indexOf(this.ship)
      this.fleet.ships.splice(position, 1)
      if (this.ship.hasAce) {
        this.fleet.aceSelected = false
      }
      this.$store.builder.recalculatePPA()
    },

    duplicate() {
      const position = this.fleet.ships.indexOf(this.ship)
      const duplicatedShip = copy(this.ship)
      duplicatedShip._key = generateKey()
      if (duplicatedShip.hasOwnProperty('systems')) {
        duplicatedShip.systems.forEach((system) => {
          system._key = generateKey()
        })
      }
      this.fleet.ships.splice(position, 0, duplicatedShip)
      if (this.ship.hasAce) {
        this.ship.hasAce = false
        delete this.ship.aceType
      }
      this.$store.builder.recalculatePPA()
    },

    setAce(hasAce) {
      this.ship.hasAce = hasAce
      this.fleet.aceSelected = hasAce
      if (!hasAce) {
        delete this.ship.aceType
      }
      this.$store.builder.saveState()
    },

    changeAceType(newType) {
      this.ship.aceType = newType
      this.$store.builder.saveState()
    },
  }))

  Alpine.data('systemComponent', (system) => ({
    system,
    secondSystem: false,

    init() {
      this.secondSystem = !!this.system.attackType2
    },

    changeClass(newClass) {
      this.system.class = newClass
      if (this.system.class === ShipSystem.ATTACK) {
        this.changeAttackType(AttackType.POINT_DEFENSE)
      }
      this.$store.builder.recalculatePPA()
    },

    changeAttackType(newType) {
      this.system.attackType = newType
      this.$store.builder.saveState()
    },

    changeAttackType2(newType) {
      this.system.attackType2 = newType
      this.$store.builder.saveState()
    },

    flipSecondSystem() {
      this.secondSystem = !this.secondSystem
      if (!this.secondSystem) {
        delete this.system.attackType2
      }
      this.$store.builder.saveState()
    },
  }))
})
