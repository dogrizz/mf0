document.addEventListener('alpine:init', () => {
  Alpine.data('battlesPage', () => ({
    battles: {},

    init() {
      this.battles = readBattles() || {}
    },

    get entries() {
      return Object.entries(this.battles)
    },

    battleDate(battle) {
      return new Date(battle.date).toLocaleString()
    },

    battleUrl(id) {
      return `battle.html?${BATTLE_ID_PARAM}=${id}`
    },

    forfeit(id) {
      delete this.battles[id]
      localStorage.setItem(BATTLE_STORAGE_KEY, JSON.stringify(this.battles))
    },
  }))
})
