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

// Inline stroke icons for each ShipSystem class, matching the tactical redesign mockup (see
// .scratch/tactical-redesign/issues/01-battle-tracker-tactical-redesign.md). Rendered via v-html
// in the template - safe here since the source is always one of these five fixed strings, never
// user-controlled data.
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
    '<svg viewBox="0 0 16 16" fill="none"><path d="M3 13h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M8 12V2M8 2L5 5M8 2l3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
}

var TRANSFER_ICON_SVG =
  '<svg viewBox="0 0 20 20" fill="none"><path d="M4 7h11M15 7l-3-3M15 7l-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 13H5M5 13l3-3M5 13l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'

var CLOSE_ICON_SVG =
  '<svg viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'

var VueBattleShipComponent = {
  props: {
    ship: { type: Object, required: true },
    fleet: { type: Object, required: true },
    battle: { type: Object, required: true },
  },
  setup: function (props) {
    var diceSegments = Vue.computed(function () {
      return battleDice(props.ship)
    })

    // The ship keeps its original owner id after a transfer - only its location in the roster's
    // fleets changes, not this field (see tests/battle.test.js). That's a game-rules requirement,
    // not just a display artifact: the original owner retains control over the ship's system
    // (white) dice even after capture, so the "captured" styling below surfaces who that was.
    var isCaptured = Vue.computed(function () {
      return props.ship.owner !== props.fleet.id
    })

    var originalFleetName = Vue.computed(function () {
      var owner = props.battle.roster.find(function (f) {
        return f.id === props.ship.owner
      })
      return owner ? owner.name : ''
    })

    function systemText(system) {
      if (system.class !== ShipSystem.ATTACK) {
        return system.class
      }
      var text = ATTACK_TYPE_LABELS[system.attackType]
      if (system.attackType2) {
        text = text + ' / ' + ATTACK_TYPE_LABELS[system.attackType2]
      }
      return text
    }

    function systemIcon(systemClass) {
      return SHIP_SYSTEM_ICONS[systemClass] || ''
    }

    function systemStateChange(system, newState) {
      applySystemDamage(props.ship, props.fleet, props.battle.roster, system, newState)
    }

    function otherFleets() {
      return props.battle.roster.filter(function (f) {
        return f !== props.fleet
      })
    }

    function fleetAccent(fleet) {
      return fleetAccentColor(props.battle.roster.indexOf(fleet))
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
      diceSegments: diceSegments,
      isCaptured: isCaptured,
      originalFleetName: originalFleetName,
      systemText: systemText,
      systemIcon: systemIcon,
      systemStateChange: systemStateChange,
      otherFleets: otherFleets,
      fleetAccent: fleetAccent,
      startTransfer: startTransfer,
      pickTransferTarget: pickTransferTarget,
      cancelTransfer: cancelTransfer,
      transferIconSvg: TRANSFER_ICON_SVG,
      closeIconSvg: CLOSE_ICON_SVG,
    }
  },
  template: vueBattleShipTemplate,
}
