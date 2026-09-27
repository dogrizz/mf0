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

// Fleet-builder disclosure toggle (replaces Bootstrap's accordion chevron, tactical redesign
// ticket 02) - rotated 90deg via the .is-open class rather than swapped for a second icon.
var CHEVRON_ICON_SVG =
  '<svg viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'

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
      fleetAccent: fleetAccentColor,
      chevronIconSvg: CHEVRON_ICON_SVG,
    }
  },
  template: vueBuilderAppTemplate,
}
