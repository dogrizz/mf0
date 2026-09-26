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
//
// The URL passed to xhr.open() is resolved against the document's location, not this script's own
// src - unlike fetch() from options-link/app-footer, plain XHR has no equivalent to
// document.currentScript.src-relative resolution. So it must spell out this component's full
// path from the page root (builder/components/...) rather than just its filename.

var vueBuilderSystemTemplate = (function () {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', 'builder/components/vue-builder-system.template.html', false)
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
      setSystemAttackType(props.system, newType)
      saveState()
    }

    function changeClass(newClass) {
      setSystemClass(props.system, newClass)
      recalculatePPA()
    }

    function changeAttackType2(newType) {
      setSystemSecondAttackType(props.system, newType)
      saveState()
    }

    function flipSecondSystem() {
      secondSystem.value = !secondSystem.value
      if (!secondSystem.value) {
        clearSystemSecondAttackType(props.system)
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
