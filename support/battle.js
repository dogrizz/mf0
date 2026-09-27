function companyDice(company) {
  if (company.destroyed || company.outOfFuel) {
    return []
  }
  var segments = []
  var internals = company.systems.filter(function (system) {
    return system.class === MechSystem.SYSTEM && !system.disabled
  }).length
  if (internals) {
    segments.push(diceSegment(`${internals}W`, 'W'))
  }
  var attack = company.systems.filter(function (system) {
    return system.class === MechSystem.WEAPON && !system.disabled
  }).length
  if (attack) {
    segments.push(diceSegment('2Rd', 'R'))
  }
  var defense = company.systems.filter(function (system) {
    return system.class === MechSystem.DEFENSE && !system.disabled
  }).length
  if (defense) {
    segments.push(diceSegment(`${defense}B`, 'B'))
  }
  var comms = company.systems.filter(function (system) {
    return system.class === MechSystem.COMMS && !system.disabled
  }).length
  if (comms) {
    segments.push(diceSegment(`${comms}Y`, 'Y'))
  }
  var movement = company.systems.filter(function (system) {
    return system.class === MechSystem.MOVEMENT && !system.disabled
  }).length
  if (movement) {
    segments.push(diceSegment(`${movement}G`, 'G'))
  }
  if (company.aceType) {
    // aceType is always one of ACE_TYPES' four color names (red/blue/green/yellow - see
    // builder/components/vue-builder-mech-companies.js), so the leading letter already matches a
    // DICE_COLORS key and colors the suffix to the same hue as the ace's assigned swatch.
    var letter = company.aceType[0].toUpperCase()
    segments.push(diceSegment(`+${letter}d8`, letter))
  }
  return segments
}

// Battle-domain dice notation: counts real non-disabled internal systems, since every
// battle-shaped ship has already been backfilled with them by readBattle's migration (see
// CONTEXT.md's "Battle-shaped ship") - unlike support/builder.js's builderDice, which always
// shows the 2W baseline because builder-shaped ships never have internal systems yet.
function battleDice(ship) {
  if (ship.destroyed) {
    return []
  }
  var internals = ship.systems.filter(function (system) {
    return system.class === ShipSystem.INTERNAL && !system.disabled
  }).length
  var segments = internals ? [diceSegment(`${internals}W`, 'W')] : []
  return segments.concat(shipSystemsDice(ship))
}

function hasInternals(ship) {
  return ship.systems.some((system) => system.class === 'internal')
}

// Reads a saved battle, lazily migrating it in place the first time it's opened: backfilling
// `internal` systems (see CONTEXT.md's "Internal system") and mech company data for
// battle-shaped ships. Calls into support/storage.js only for the raw read/write.
function readBattle(id) {
  const _id = parseInt(id)
  const battles = readBattles()
  if (battles.hasOwnProperty(_id)) {
    const decompressed = LZString.decompress(battles[_id].data)
    const battle = JSON.parse(decompressed)
    if (!battle.hasOwnProperty('id')) {
      battle.id = _id
    }
    if (!battle.track || !battle.sync) {
      battle.roster.forEach(function (player) {
        player.ships = null
      })
      store(battle)
    } else {
      if (!alreadyAddedInternals(battle)) {
        battle.roster.forEach((player) => {
          player.id = self.crypto.randomUUID()
          player.ships.forEach((ship) => {
            ship.owner = player.id
            ship.id = self.crypto.randomUUID()
            ship.systems.push({ class: ShipSystem.INTERNAL })
            ship.systems.push({ class: ShipSystem.INTERNAL })
            ship.systems = ship.systems.filter((system) => system.class)
            ship.systems = [...ship.systems].sort()
          })
        })
      }
      if (!alreadySetUpCompanies(battle)) {
        battle.roster.forEach((player) => buildCompanyData(player))
        store(battle)
      }
    }

    return battle
  }
  return null
}

function alreadyAddedInternals(battle) {
  return battle.roster.some((player) => player.ships.some((ship) => hasInternals(ship)))
}

function alreadySetUpCompanies(battle) {
  return battle.roster.some((player) => player.hasOwnProperty('companies'))
}

function buildCompanyData(player) {
  player.companies = []
  player.ships.forEach(function (ship) {
    ship.systems.forEach(function (system) {
      if (system.class === ShipSystem.CATAPULT) {
        const company = {
          origin: ship.name,
          systems: [
            { class: MechSystem.WEAPON },
            { class: MechSystem.DEFENSE },
            { class: MechSystem.COMMS },
            { class: MechSystem.MOVEMENT },
            { class: MechSystem.SYSTEM },
            { class: MechSystem.SYSTEM },
          ],
        }
        player.companies.push(company)
      }
    })
    if (ship.hasAce) {
      player.companies[player.companies.length - 1].aceType = ship.aceType
    }
  })
}

// Attaches `total`/`role` as Vue `computed` properties, one pair per player, replacing the old
// imperative recalculate()/determineRole() calls that used to be scattered across every mutation
// (see .scratch/support-domain-split/issues/02-spike-computed-total-and-role.md). Must be called
// once the roster is already inside Vue's
// reactive tree (i.e. in battle.js's page entry, right after `readBattle()`'s result is assigned
// into the reactive battle state) - a computed's getter only tracks dependencies read through a
// reactive Proxy's `get` trap, so calling this on readBattle()'s plain returned object would
// attach computeds that cache their first value forever and never update.
function attachComputedTotalAndRole(roster) {
  roster.forEach((player) => {
    player.total = Vue.computed(() => player.ppa * (player.hva + player.tas))
  })
  roster.forEach((player) => {
    player.role = Vue.computed(() => {
      const sorted = [...roster].sort((a, b) => b.total - a.total)
      let role = ''
      if (player.total === sorted[0].total) role = 'Defender'
      if (player.total === sorted[roster.length - 1].total) role = 'Primary attacker'
      if (role === '') role = 'Secondary attacker'
      return role
    })
  })
}

// Applies a damage-toggle to one system on a ship or mech company: flips its disabled flag, then
// destroys/revives the whole entity once all/some of its systems are enabled again, adjusting the
// owning fleet's tas accordingly. Shared by ships and mech companies since both track damage the
// same way (a `systems` array plus a `destroyed` flag). The fleet's total/role recompute on their
// own via the computed properties attached in battle.js - no recalculate call needed here.
function applySystemDamage(entity, fleet, system, disabled) {
  system.disabled = disabled
  if (entity.systems.filter((s) => !s.disabled).length === 0) {
    entity.destroyed = true
    fleet.tas--
  } else if (entity.destroyed) {
    entity.destroyed = false
    fleet.tas++
  }
}

function toggleCompanyFuel(company, fleet) {
  company.outOfFuel = !company.outOfFuel
  if (company.outOfFuel) {
    fleet.tas--
  } else {
    fleet.tas++
  }
}

// fromFleet/toFleet's total/role recompute on their own once tas changes, via the computed
// properties attached in battle.js - previously this never called recalculate(), silently
// leaving both fleets' total/role stale after a transfer.
function transferShip(ship, fromFleet, toFleet) {
  fromFleet.tas--
  toFleet.tas++
  fromFleet.ships.splice(fromFleet.ships.indexOf(ship), 1)
  toFleet.ships.push(ship)
}

function changePlayerHva(player, newHva) {
  player.hva = parseInt(newHva)
}

function changePlayerTas(player, newTas) {
  player.tas = parseInt(newTas)
}
