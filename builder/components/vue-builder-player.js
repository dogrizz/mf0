// Vue equivalent of builder.js's PlayerComponent (Mithril): one scoreboard row (name, HVA, TAs,
// systems, live PPA/total). See vue-builder-system.js for why this component's template is
// loaded via synchronous XHR rather than the fetch()+defineAsyncComponent pattern from ticket 07.

var vueBuilderPlayerTemplate = (function () {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', 'builder/components/vue-builder-player.template.html', false)
  xhr.send(null)
  return xhr.responseText
})()

var VueBuilderPlayerComponent = {
  props: {
    player: { type: Object, required: true },
    state: { type: Object, required: true },
  },
  setup: function (props) {
    function changeName(newName) {
      props.player.name = newName
    }

    function changeHva(newHva) {
      props.player.hva = parseInt(newHva)
      recalculatePPA()
    }

    function changeTas(newTas) {
      props.player.tas = parseInt(newTas)
      recalculatePPA()
    }

    function changeSystems(newSystems) {
      props.player.systems = parseInt(newSystems)
      recalculatePPA()
    }

    function remove() {
      var position = props.state.players.indexOf(props.player)
      props.state.players.splice(position, 1)
      recalculatePPA()
    }

    return {
      changeName: changeName,
      changeHva: changeHva,
      changeTas: changeTas,
      changeSystems: changeSystems,
      remove: remove,
    }
  },
  template: vueBuilderPlayerTemplate,
}
