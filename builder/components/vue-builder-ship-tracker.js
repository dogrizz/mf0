// Vue equivalent of builder.js's ShipTrackerComponent (Mithril): the accordion body content -
// the sync checkbox plus every player's fleet-builder block.

var vueBuilderShipTrackerScriptUrl =
  document.currentScript.src || new URL('builder/components/vue-builder-ship-tracker.js', location.href).href

var VueBuilderShipTrackerComponent = Vue.defineAsyncComponent(async () => {
  const templateUrl = new URL('vue-builder-ship-tracker.template.html', vueBuilderShipTrackerScriptUrl)
  const template = await fetch(templateUrl).then((response) => response.text())

  return {
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
    template,
  }
})
