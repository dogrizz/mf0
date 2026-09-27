// Vue equivalent of builder.js's `main` object (Mithril): the fleet builder page's root - nav
// link, scoreboard, Fight! button, fleet-builder accordion, footer.

var vueBuilderAppScriptUrl = document.currentScript.src || new URL('builder/vue-builder-app.js', location.href).href

// Fleet-builder disclosure toggle (replaces Bootstrap's accordion chevron, tactical redesign
// ticket 02) - rotated 90deg via the .is-open class rather than swapped for a second icon.
var CHEVRON_ICON_SVG =
  '<svg viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'

var VueBuilderAppComponent = Vue.defineAsyncComponent(async () => {
  const templateUrl = new URL('vue-builder-app.template.html', vueBuilderAppScriptUrl)
  const template = await fetch(templateUrl).then((response) => response.text())

  return {
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
    template,
  }
})
