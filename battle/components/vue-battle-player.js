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

// 'Defender' -> 'badge-role-defender', 'Primary attacker' -> 'badge-role-primary-attacker', etc.
// - one badge modifier class per role value attachComputedTotalAndRole() produces in
// support/battle.js.
function roleBadgeClass(role) {
  return 'badge-role-' + role.toLowerCase().replace(/\s+/g, '-')
}

var VueBattlePlayerComponent = {
  props: {
    player: { type: Object, required: true },
    battle: { type: Object, required: true },
    accent: { type: String, required: true },
  },
  setup: function (props) {
    function changeHva(newHva) {
      changePlayerHva(props.player, newHva)
    }

    function changeTas(newTas) {
      changePlayerTas(props.player, newTas)
    }

    return {
      changeHva: changeHva,
      changeTas: changeTas,
      roleBadgeClass: roleBadgeClass,
    }
  },
  template: vueBattlePlayerTemplate,
}
