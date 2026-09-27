// Vue equivalent of builder.js's PlayerComponent (Mithril): one scoreboard row (name, HVA, TAs,
// systems, live PPA/total). See vue-builder-system.js for why this component's template is
// loaded via synchronous XHR rather than the fetch()+defineAsyncComponent pattern from ticket 07.

var vueBuilderPlayerTemplate = (function () {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', 'builder/components/vue-builder-player.template.html', false)
  xhr.send(null)
  return xhr.responseText
})()

// Matches battle/components/vue-battle-ship.js's CLOSE_ICON_SVG - kept as its own copy here since
// builder.js and battle.js never share component files (see CLAUDE.md's architecture notes).
// Named per-file (not just REMOVE_ICON_SVG) because every builder component file is a classic,
// non-module <script> sharing one global scope (see CLAUDE.md's architecture notes) - a name
// reused across files would collide and silently pick whichever file loaded last.
var PLAYER_REMOVE_ICON_SVG =
  '<svg viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'

var VueBuilderPlayerComponent = {
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
  template: vueBuilderPlayerTemplate,
}
