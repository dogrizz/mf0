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
