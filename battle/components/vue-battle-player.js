// Vue equivalent of battle.js's PlayerComponent (Mithril): one row of the battle tracker's
// scoreboard (fleet name, editable HVA/TAs, computed PPA/total/role). See
// builder/components/vue-builder-system.js (ticket 08) for why this component's template is
// loaded via synchronous XHR rather than the fetch()+defineAsyncComponent pattern from ticket 07.

var vueBattlePlayerTemplate = (function () {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', 'battle/components/vue-battle-player.template.html', false)
  xhr.send(null)
  return xhr.responseText
})()

// Fleet-accent palette, cycled by roster index (MFZ:IO has no hard player cap) - shared verbatim by
// vue-battle-fleet.js so a fleet's scoreboard card and its ships/companies section show the same
// dot color. See .scratch/tactical-redesign/spec.md.
var FLEET_COLORS = ['var(--mf0-fleet-a)', 'var(--mf0-fleet-b)', 'var(--mf0-fleet-c)']

var ROLE_BADGE_CLASSES = {
  Defender: 'badge-role-defender',
  'Primary attacker': 'badge-role-primary',
  'Secondary attacker': 'badge-role-secondary',
}

var VueBattlePlayerComponent = {
  props: {
    player: { type: Object, required: true },
    battle: { type: Object, required: true },
    index: { type: Number, default: 0 },
  },
  setup: function (props) {
    // Mirrors PlayerComponent's oninit: compute this player's total/role as soon as the roster is
    // known, before the user edits anything.
    recalculate(props.player, props.battle.roster)

    var fleetColor = Vue.computed(function () {
      return FLEET_COLORS[props.index % FLEET_COLORS.length]
    })

    var roleBadgeClass = Vue.computed(function () {
      return ROLE_BADGE_CLASSES[props.player.role] || 'badge-role-defender'
    })

    function changeHva(newHva) {
      changePlayerHva(props.player, props.battle.roster, newHva)
    }

    function changeTas(newTas) {
      changePlayerTas(props.player, props.battle.roster, newTas)
    }

    return {
      fleetColor: fleetColor,
      roleBadgeClass: roleBadgeClass,
      changeHva: changeHva,
      changeTas: changeTas,
    }
  },
  template: vueBattlePlayerTemplate,
}
