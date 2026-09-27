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

var VueBattlePlayerComponent = {
  props: {
    player: { type: Object, required: true },
    battle: { type: Object, required: true },
  },
  setup: function (props) {
    // Mirrors PlayerComponent's oninit: compute this player's total/role as soon as the roster is
    // known, before the user edits anything.
    recalculate(props.player, props.battle.roster)

    function changeHva(newHva) {
      changePlayerHva(props.player, props.battle.roster, newHva)
    }

    function changeTas(newTas) {
      changePlayerTas(props.player, props.battle.roster, newTas)
    }

    return {
      changeHva: changeHva,
      changeTas: changeTas,
    }
  },
  template: vueBattlePlayerTemplate,
}
