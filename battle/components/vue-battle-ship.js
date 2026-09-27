// Vue equivalent of battle.js's ShipComponent (Mithril): one ship card during a battle - name,
// transfer button + fleet-picker popup, dice notation, per-system damage checkboxes. See
// builder/components/vue-builder-system.js (ticket 08) for why this component's template is
// loaded via synchronous XHR rather than the fetch()+defineAsyncComponent pattern from ticket 07.

var vueBattleShipTemplate = (function () {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', 'battle/components/vue-battle-ship.template.html', false)
  xhr.send(null)
  return xhr.responseText
})()

// One inline stroke SVG per ShipSystem class (mirrored for MechSystem in vue-battle-company.js) -
// see .scratch/tactical-redesign/spec.md. Kept as plain markup strings (rather than a shared file)
// since this is presentation-only and each component only needs its own domain's icon set.
var SHIP_SYSTEM_ICONS = {
  internal:
    '<svg viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/></svg>',
  attack:
    '<svg viewBox="0 0 16 16" fill="none"><path d="M2 14L14 2M14 2H8M14 2V8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  defense:
    '<svg viewBox="0 0 16 16" fill="none"><path d="M8 1.5L14 4V8C14 11.5 11.5 13.8 8 14.5C4.5 13.8 2 11.5 2 8V4L8 1.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  sensor:
    '<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" fill="currentColor"/><path d="M4.5 4.5a5 5 0 000 7M11.5 4.5a5 5 0 010 7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  catapult:
    '<svg viewBox="0 0 16 16" fill="none"><path d="M2 13L9 6M9 6L13 2M9 6L11 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
}

var VueBattleShipComponent = {
  props: {
    ship: { type: Object, required: true },
    fleet: { type: Object, required: true },
    battle: { type: Object, required: true },
  },
  setup: function (props) {
    var diceText = Vue.computed(function () {
      return battleDice(props.ship)
    })

    // The ship keeps its original owner id after a transfer - only its location in the roster's
    // fleets changes, not this field (see tests/battle.test.js). That's a game-rules requirement,
    // not just a display artifact: the original owner retains control over the ship's system
    // (white) dice even after capture, so the "captured" styling below surfaces who that was.
    var isCaptured = Vue.computed(function () {
      return props.ship.owner !== props.fleet.id
    })

    var capturedFromName = Vue.computed(function () {
      var owner = props.battle.roster.find(function (p) {
        return p.id === props.ship.owner
      })
      return owner ? owner.name : 'unknown fleet'
    })

    function systemIcon(systemClass) {
      return SHIP_SYSTEM_ICONS[systemClass] || ''
    }

    // FLEET_COLORS is defined once in vue-battle-player.js (loaded earlier in battle.html's script
    // order) - reused here so the transfer dialog's target list agrees with the scoreboard/fleet
    // header's dot color for the same fleet.
    function fleetColorFor(targetFleet) {
      return FLEET_COLORS[props.battle.roster.indexOf(targetFleet) % FLEET_COLORS.length]
    }

    function systemText(system) {
      if (system.class !== ShipSystem.ATTACK) {
        return system.class
      }
      var text = system.class + ' ' + system.attackType
      if (system.attackType2) {
        text = text + '/' + system.attackType2
      }
      return text
    }

    function systemStateChange(system, newState) {
      applySystemDamage(props.ship, props.fleet, props.battle.roster, system, newState)
    }

    function otherFleets() {
      return props.battle.roster.filter(function (f) {
        return f !== props.fleet
      })
    }

    function transfer(targetFleet) {
      transferShip(props.ship, props.fleet, targetFleet)
    }

    function startTransfer() {
      if (props.battle.roster.length === 2) {
        transfer(otherFleets()[0])
      } else {
        props.ship.showPopup = true
      }
    }

    function pickTransferTarget(targetFleet) {
      props.ship.showPopup = false
      transfer(targetFleet)
    }

    function cancelTransfer() {
      props.ship.showPopup = false
    }

    return {
      diceText: diceText,
      isCaptured: isCaptured,
      capturedFromName: capturedFromName,
      systemIcon: systemIcon,
      fleetColorFor: fleetColorFor,
      systemText: systemText,
      systemStateChange: systemStateChange,
      otherFleets: otherFleets,
      startTransfer: startTransfer,
      pickTransferTarget: pickTransferTarget,
      cancelTransfer: cancelTransfer,
    }
  },
  template: vueBattleShipTemplate,
}
