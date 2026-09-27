// Vue equivalent of builder.js's FleetComponent (Mithril): one player's fleet-builder block
// (heading, ships grid, "Add ship"). See vue-builder-system.js for why this component's template
// is loaded via synchronous XHR rather than the fetch()+defineAsyncComponent pattern from
// ticket 07.

var vueBuilderFleetTemplate = (function () {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', 'builder/components/vue-builder-fleet.template.html', false)
  xhr.send(null)
  return xhr.responseText
})()

// Matches battle/components/vue-battle-fleet.js's pluralize - kept as its own copy here since
// builder.js and battle.js never share component files (see CLAUDE.md's architecture notes).
function pluralize(count, singular, plural) {
  return count + ' ' + (count === 1 ? singular : plural)
}

var VueBuilderFleetComponent = {
  props: {
    fleet: { type: Object, required: true },
    accent: { type: String, required: true },
  },
  setup: function (props) {
    // Mirrors FleetComponent's oninit: back-fills `ships` for fleets saved before that field
    // existed.
    migrateFleetShips(props.fleet)

    var meta = Vue.computed(function () {
      return pluralize(props.fleet.ships.length, 'ship', 'ships')
    })

    function add() {
      addShip(props.fleet)
      recalculatePPA()
    }

    return {
      meta: meta,
      add: add,
    }
  },
  template: vueBuilderFleetTemplate,
}
