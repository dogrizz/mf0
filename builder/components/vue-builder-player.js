// Vue equivalent of builder.js's PlayerComponent (Mithril): one scoreboard row (name, HVA, TAs,
// systems, live PPA/total).

var vueBuilderPlayerScriptUrl = document.currentScript.src || new URL('builder/components/vue-builder-player.js', location.href).href

// Matches battle/components/vue-battle-ship.js's CLOSE_ICON_SVG - kept as its own copy here since
// builder.js and battle.js never share component files (see CLAUDE.md's architecture notes).
// Named per-file (not just REMOVE_ICON_SVG) because every builder component file is a classic,
// non-module <script> sharing one global scope (see CLAUDE.md's architecture notes) - a name
// reused across files would collide and silently pick whichever file loaded last.
var PLAYER_REMOVE_ICON_SVG =
  '<svg viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'

var VueBuilderPlayerComponent = Vue.defineAsyncComponent(async () => {
  const templateUrl = new URL('vue-builder-player.template.html', vueBuilderPlayerScriptUrl)
  const template = await fetch(templateUrl).then((response) => response.text())

  return {
    props: {
      player: { type: Object, required: true },
      state: { type: Object, required: true },
      accent: { type: String, required: true },
    },
    setup: function (props) {
      function changeName(newName) {
        props.player.name = newName
      }

      function changeHva(newHva) {
        props.player.hva = parseInt(newHva)
        recalculatePPA()
      }

      function changeTas(newTas) {
        props.player.tas = parseInt(newTas)
        recalculatePPA()
      }

      function changeSystems(newSystems) {
        props.player.systems = parseInt(newSystems)
        recalculatePPA()
      }

      function remove() {
        var position = props.state.players.indexOf(props.player)
        props.state.players.splice(position, 1)
        recalculatePPA()
      }

      return {
        changeName: changeName,
        changeHva: changeHva,
        changeTas: changeTas,
        changeSystems: changeSystems,
        remove: remove,
        removeIconSvg: PLAYER_REMOVE_ICON_SVG,
      }
    },
    template,
  }
})
