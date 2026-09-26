// Vue equivalent of builder.js's `main` object (Mithril): the fleet builder page's root - nav
// link, scoreboard, Fight! button, fleet-builder accordion, footer. See vue-builder-system.js for
// why this component's template is loaded via synchronous XHR rather than the fetch()+
// defineAsyncComponent pattern from ticket 07 - true for every component on this page, but load
// order matters most for the root: it's what builder.js mounts directly, and must already be
// rendered (not behind an async placeholder) by the time the page's very first synchronous DOM
// query runs, matching the previous Mithril page's synchronous initial render.

var vueBuilderAppTemplate = (function () {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', 'builder/vue-builder-app.template.html', false)
  xhr.send(null)
  return xhr.responseText
})()

var VueBuilderAppComponent = {
  props: {
    state: { type: Object, required: true },
  },
  setup: function (props) {
    function addPlayer() {
      props.state.players.push({
        name: 'Player',
        hva: 3,
        tas: 5,
        systems: 10,
        ppa: 5,
        ships: [],
      })
      recalculatePPA()
    }

    function toggleTrackShips() {
      props.state.track = !props.state.track
      if (!props.state.track) {
        props.state.sync = false
      }
    }

    function fight() {
      location.href = 'battle.html?' + BATTLE_ID_PARAM + '=' + storeBattle(props.state.players, props.state.track, props.state.sync)
    }

    return {
      addPlayer: addPlayer,
      toggleTrackShips: toggleTrackShips,
      fight: fight,
    }
  },
  template: vueBuilderAppTemplate,
}
