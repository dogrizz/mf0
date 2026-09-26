// Vue equivalent of builder.js's FleetComponent (Mithril): one player's fleet-builder block
// (heading, ships grid, "Add ship"). See vue-builder-system.js for why this component's template
// is loaded via synchronous XHR rather than the fetch()+defineAsyncComponent pattern from
// ticket 07.

var vueBuilderFleetTemplate = (function () {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', 'vue-builder-fleet.template.html', false)
  xhr.send(null)
  return xhr.responseText
})()

var VueBuilderFleetComponent = {
  props: {
    fleet: { type: Object, required: true },
  },
  setup: function (props) {
    // Mirrors FleetComponent's oninit: back-fills `ships` for fleets saved before that field
    // existed.
    if (!props.fleet.hasOwnProperty('ships')) {
      props.fleet.ships = []
      for (var i = 0; i < props.fleet.tas; i++) {
        props.fleet.ships.push({})
      }
    }

    function add() {
      props.fleet.ships.push({ systems: [] })
      recalculatePPA()
    }

    return {
      add: add,
    }
  },
  template: vueBuilderFleetTemplate,
}
