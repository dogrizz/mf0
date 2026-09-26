// Vue equivalent of builder.js's SystemComponent (Mithril): one system slot's class dropdown
// plus its attack-type dropdown(s) when the slot is set to "Attack".
//
// Unlike vue-options-link.js/vue-app-footer.js (ticket 07), this component's template is loaded
// with a synchronous XMLHttpRequest rather than fetch()+defineAsyncComponent. The fleet builder's
// characterization suite (tests/builder.test.js) drives the page through DOM events with no
// initial await before the first interaction, mirroring how the current Mithril page renders
// fully synchronously on mount - an async component would render nothing until its template
// promise resolves, breaking that first synchronous query. A same-origin, same-directory text
// file is a reasonable case for the deprecated-but-supported synchronous XHR read.

var vueBuilderSystemTemplate = (function () {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', 'vue-builder-system.template.html', false)
  xhr.send(null)
  return xhr.responseText
})()

var VueBuilderSystemComponent = {
  props: {
    system: { type: Object, required: true },
  },
  setup: function (props) {
    var secondSystem = Vue.ref(props.system.attackType2 !== undefined)

    function changeAttackType(newType) {
      props.system.attackType = newType
      saveState()
    }

    function changeClass(newClass) {
      props.system.class = newClass
      if (props.system.class === ShipSystem.ATTACK) {
        changeAttackType(AttackType.POINT_DEFENSE)
      }
      recalculatePPA()
    }

    function changeAttackType2(newType) {
      props.system.attackType2 = newType
      saveState()
    }

    function flipSecondSystem() {
      secondSystem.value = !secondSystem.value
      if (!secondSystem.value) {
        delete props.system.attackType2
      }
      saveState()
    }

    return {
      ShipSystem: ShipSystem,
      AttackType: AttackType,
      secondSystem: secondSystem,
      changeClass: changeClass,
      changeAttackType: changeAttackType,
      changeAttackType2: changeAttackType2,
      flipSecondSystem: flipSecondSystem,
    }
  },
  template: vueBuilderSystemTemplate,
}
