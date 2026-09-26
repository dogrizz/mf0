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
      props.ship.hasAce = hasAce
      props.fleet.aceSelected = hasAce
      if (!hasAce) {
        delete props.ship.aceType
      }
      saveState()
    }

    function changeAceType(newType) {
      props.ship.aceType = newType
      saveState()
    }

    return {
      catapults: catapults,
      setAce: setAce,
      changeAceType: changeAceType,
    }
  },
  template: vueBuilderMechCompaniesTemplate,
}
