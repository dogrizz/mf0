// Vue equivalent of builder.js's ShipTrackerComponent (Mithril): the accordion body content -
// the sync checkbox plus every player's fleet-builder block. See vue-builder-system.js for why
// this component's template is loaded via synchronous XHR rather than the fetch()+
// defineAsyncComponent pattern from ticket 07.

var vueBuilderShipTrackerTemplate = (function () {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', 'builder/components/vue-builder-ship-tracker.template.html', false)
  xhr.send(null)
  return xhr.responseText
})()

var VueBuilderShipTrackerComponent = {
  props: {
    state: { type: Object, required: true },
  },
  setup: function (props) {
    function setSync(checked) {
      props.state.sync = checked
      recalculatePPA()
    }

    return {
      setSync: setSync,
      fleetAccent: fleetAccentColor,
    }
  },
  template: vueBuilderShipTrackerTemplate,
}
