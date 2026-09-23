document.addEventListener('alpine:init', () => {
  Alpine.data('battlePage', () => ({
    battle: null,

    init() {
      const params = new URLSearchParams(window.location.search)
      if (params.has(BATTLE_ID_PARAM)) {
        this.battle = readBattle(params.get(BATTLE_ID_PARAM))
      }
    },
  }))

  Alpine.data('playerComponent', (player, battle) => ({
    player,

    init() {
      recalculate(this.player, battle.roster)
    },

    changeHva(newHva) {
      this.player.hva = parseInt(newHva)
      recalculate(this.player, battle.roster)
      store(battle)
    },

    changeTas(newTas) {
      this.player.tas = parseInt(newTas)
      recalculate(this.player, battle.roster)
      store(battle)
    },
  }))

  Alpine.data('shipComponent', (ship, fleet, battle) => ({
    ship,
    fleet,

    get dice() {
      return dice(this.ship)
    },

    get classes() {
      return 'ship col-3 row row-cols-1 rounded-3 p-1 m-0 ' + (this.ship.destroyed ? ' dead' : 'bg-dark')
    },

    get nameClasses() {
      return 'col ' + (this.ship.owner !== this.fleet.id ? ' captured' : '')
    },

    get nameTitle() {
      return this.ship.name + (this.ship.destroyed ? ' dead ' : ' ') + (this.ship.owner !== this.fleet.id ? 'captured' : '')
    },

    get otherFleets() {
      return battle.roster.filter((f) => f !== this.fleet)
    },

    systemText(system) {
      let text = system.class
      if (system.class === ShipSystem.ATTACK) {
        text = `${text} ${system.attackType}`
        if (system.attackType2) {
          text = `${text}/${system.attackType2}`
        }
      }
      return text
    },

    systemStateChange(system, newState) {
      system.disabled = newState
      if (this.ship.systems.filter((s) => !s.disabled).length === 0) {
        this.ship.destroyed = true
        this.fleet.tas--
        recalculate(this.fleet, battle.roster)
      } else if (this.ship.destroyed) {
        this.ship.destroyed = false
        this.fleet.tas++
        recalculate(this.fleet, battle.roster)
      }
      store(battle)
    },

    startTransfer() {
      if (battle.roster.length === 2) {
        this.transfer(this.otherFleets[0])
      } else {
        this.ship.showPopup = true
      }
    },

    transfer(targetFleet) {
      this.fleet.tas--
      targetFleet.tas++
      this.fleet.ships.splice(this.fleet.ships.indexOf(this.ship), 1)
      targetFleet.ships.push(this.ship)
      this.ship.showPopup = false
      store(battle)
    },

    cancelTransfer() {
      this.ship.showPopup = false
    },
  }))

  Alpine.data('companyComponent', (company, fleet, battle) => ({
    company,
    fleet,

    get dice() {
      return companyDice(this.company)
    },

    get classes() {
      return 'company col-3 row row-cols-1 p-1 m-0 rounded-3 ' + (this.company.destroyed || this.company.outOfFuel ? 'dead' : ' bg-dark')
    },

    get label() {
      return this.company.aceType ? `${this.company.aceType} ace` : 'company'
    },

    systemStateChange(system, newState) {
      system.disabled = newState
      if (this.company.systems.filter((s) => !s.disabled).length === 0) {
        this.company.destroyed = true
        this.fleet.tas--
        recalculate(this.fleet, battle.roster)
      } else if (this.company.destroyed) {
        this.company.destroyed = false
        this.fleet.tas++
        recalculate(this.fleet, battle.roster)
      }
      store(battle)
    },

    fuelChange() {
      this.company.outOfFuel = !this.company.outOfFuel
      if (this.company.outOfFuel) {
        this.fleet.tas--
      } else {
        this.fleet.tas++
      }
      recalculate(this.fleet, battle.roster)
      store(battle)
    },
  }))
})
