// Vue equivalent of builder.js's MechCompanies (Mithril): the ace-selection block shown per ship
// once it has at least one catapult system. See vue-builder-system.js for why this component's
// template is loaded via synchronous XHR rather than the fetch()+defineAsyncComponent pattern
// from ticket 07.

var vueBuilderMechCompaniesTemplate = (function () {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', 'builder/components/vue-builder-mech-companies.template.html', false)
  xhr.send(null)
  return xhr.responseText
})()

// The ace-type picker shows ace color as a swatch rather than text alone (tactical redesign
// ticket 02), reusing the same red/blue/yellow hues the redesign already assigns to
// danger/focus/warning status elsewhere, plus success-green for the "green ace" option not
// otherwise represented in the palette.
var ACE_TYPES = [
  { value: 'red', label: 'Red ace', color: 'var(--tac-danger)' },
  { value: 'blue', label: 'Blue ace', color: 'var(--tac-focus)' },
  { value: 'green', label: 'Green ace', color: 'var(--tac-success)' },
  { value: 'yellow', label: 'Yellow ace', color: 'var(--tac-warning)' },
]

var VueBuilderMechCompaniesComponent = {
  props: {
    ship: { type: Object, required: true },
    fleet: { type: Object, required: true },
  },
  setup: function (props) {
    var catapults = Vue.computed(function () {
      if (!props.ship.hasOwnProperty('systems')) {
        return []
      }
      return props.ship.systems.filter(function (system) {
        return system.class === ShipSystem.CATAPULT
      })
    })

    function setAce(hasAce) {
      setShipAce(props.ship, props.fleet, hasAce)
      saveState()
    }

    function changeAceType(newType) {
      setShipAceType(props.ship, newType)
      saveState()
    }

    return {
      catapults: catapults,
      setAce: setAce,
      changeAceType: changeAceType,
      aceTypes: ACE_TYPES,
    }
  },
  template: vueBuilderMechCompaniesTemplate,
}
