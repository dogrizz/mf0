const BATTLE_STORAGE_KEY = 'mf0-battles'

// Generic, domain-blind localStorage/LZString CRUD for saved battles - no reference to
// ShipSystem/MechSystem or any battle-shaped concept belongs in this file (see
// docs/adr/0001-split-support-js-by-domain.md). Battle-domain logic (readBattle's migration,
// mutators) lives in support/battle.js and calls into this file only for the raw read/write.

function hash(str) {
  return str.split('').reduce((prev, curr) => (Math.imul(31, prev) + curr.charCodeAt(0)) | 0, 0)
}

function store(battle) {
  storeBattle(battle.roster, battle.track, battle.sync, battle.id)
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

function readBattles() {
  const battles = localStorage.getItem(BATTLE_STORAGE_KEY)
  if (battles === null) {
    return null
  }
  return JSON.parse(battles)
}

function forfeitBattle(battles, id) {
  delete battles[id]
  localStorage.setItem(BATTLE_STORAGE_KEY, JSON.stringify(battles))
}
