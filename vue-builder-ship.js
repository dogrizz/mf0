// Vue equivalent of builder.js's ShipComponent (Mithril): one ship card (name, copy/remove,
// dice notation, class select, system slots, mech companies). See vue-builder-system.js for why
// this component's template is loaded via synchronous XHR rather than the fetch()+
// defineAsyncComponent pattern from ticket 07.

var vueBuilderShipTemplate = (function () {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', 'vue-builder-ship.template.html', false)
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
      if (props.ship.class !== newClass) {
        props.ship.class = newClass
        props.ship.systems = []
        var systems = MAX_SYSTEMS.hasOwnProperty(newClass) ? MAX_SYSTEMS[newClass] : 0
        for (var i = 0; i < systems; i++) {
          props.ship.systems.push({ class: '' })
        }
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
      var position = props.fleet.ships.indexOf(props.ship)
      props.fleet.ships.splice(position, 1)
      if (props.ship.hasAce) {
        props.fleet.aceSelected = false
      }
      recalculatePPA()
    }

    function duplicate() {
      var position = props.fleet.ships.indexOf(props.ship)
      props.fleet.ships.splice(position, 0, copy(props.ship))
      if (props.ship.hasAce) {
        props.ship.hasAce = false
        delete props.ship.aceType
      }
      recalculatePPA()
    }

    var diceText = Vue.computed(function () {
      return dice(props.ship)
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
