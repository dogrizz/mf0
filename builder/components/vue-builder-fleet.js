// Vue equivalent of builder.js's FleetComponent (Mithril): one player's fleet-builder block
// (heading, ships grid, "Add ship").

var vueBuilderFleetScriptUrl = document.currentScript.src || new URL('builder/components/vue-builder-fleet.js', location.href).href

// Matches battle/components/vue-battle-fleet.js's pluralize - kept as its own copy here since
// builder.js and battle.js never share component files (see CLAUDE.md's architecture notes).
function pluralize(count, singular, plural) {
  return count + ' ' + (count === 1 ? singular : plural)
}

var VueBuilderFleetComponent = Vue.defineAsyncComponent(async () => {
  const templateUrl = new URL('vue-builder-fleet.template.html', vueBuilderFleetScriptUrl)
  const template = await fetch(templateUrl).then((response) => response.text())

  return {
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
    template,
  }
})
