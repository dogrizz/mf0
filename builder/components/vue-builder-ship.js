// Vue equivalent of builder.js's ShipComponent (Mithril): one ship card (name, copy/remove,
// dice notation, class select, system slots, mech companies). See vue-builder-system.js for why
// this component's template is loaded via synchronous XHR rather than the fetch()+
// defineAsyncComponent pattern from ticket 07.

var vueBuilderShipTemplate = (function () {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', 'builder/components/vue-builder-ship.template.html', false)
  xhr.send(null)
  return xhr.responseText
})()

var VueBuilderShipComponent = {
  props: {
    ship: { type: Object, required: true },
    fleet: { type: Object, required: true },
  },
  setup: function (props) {
    function changeClass(newClass) {
      if (setShipClass(props.ship, newClass)) {
        saveState()
      }
    }

    // Mirrors ShipComponent's oninit: a freshly added ship (no class yet) gets a random name and
    // defaults to a frigate loadout.
    if (!props.ship.class) {
      props.ship.name = randomShipName()
      changeClass(ShipType.FRIGATE)
    }

    function changeName(newName) {
      props.ship.name = newName
    }

    function remove() {
      removeShip(props.fleet, props.ship)
      recalculatePPA()
    }

    function duplicate() {
      duplicateShip(props.fleet, props.ship)
      recalculatePPA()
    }

    var diceText = Vue.computed(function () {
      return builderDice(props.ship)
    })

    return {
      ShipType: ShipType,
      diceText: diceText,
      changeName: changeName,
      changeClass: changeClass,
      remove: remove,
      duplicate: duplicate,
    }
  },
  template: vueBuilderShipTemplate,
}
