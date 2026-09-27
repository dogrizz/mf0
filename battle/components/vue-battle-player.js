// Vue equivalent of battle.js's PlayerComponent (Mithril): one row of the battle tracker's
// scoreboard (fleet name, editable HVA/TAs, computed PPA/total/role).

var vueBattlePlayerScriptUrl = document.currentScript.src || new URL('battle/components/vue-battle-player.js', location.href).href

// 'Defender' -> 'badge-role-defender', 'Primary attacker' -> 'badge-role-primary-attacker', etc.
// - one badge modifier class per role value attachComputedTotalAndRole() produces in
// support/battle.js.
function roleBadgeClass(role) {
  return 'badge-role-' + role.toLowerCase().replace(/\s+/g, '-')
}

var VueBattlePlayerComponent = Vue.defineAsyncComponent(async () => {
  const templateUrl = new URL('vue-battle-player.template.html', vueBattlePlayerScriptUrl)
  const template = await fetch(templateUrl).then((response) => response.text())

  return {
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
    template,
  }
})
