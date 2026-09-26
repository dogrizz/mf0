// Vue equivalent of battle.js's CompanyComponent (Mithril): one mech company card during a
// battle - fuel toggle, dice notation, per-system damage checkboxes. See
// builder/components/vue-builder-system.js (ticket 08) for why this component's template is
// loaded via synchronous XHR rather than the fetch()+defineAsyncComponent pattern from ticket 07.

var vueBattleCompanyTemplate = (function () {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', 'battle/components/vue-battle-company.template.html', false)
  xhr.send(null)
  return xhr.responseText
})()

var VueBattleCompanyComponent = {
  props: {
    company: { type: Object, required: true },
    fleet: { type: Object, required: true },
    battle: { type: Object, required: true },
  },
  setup: function (props) {
    var diceText = Vue.computed(function () {
      return companyDice(props.company)
    })

    function systemStateChange(system, newState) {
      system.disabled = newState
      if (
        props.company.systems.filter(function (s) {
          return !s.disabled
        }).length === 0
      ) {
        props.company.destroyed = true
        props.fleet.tas--
        recalculate(props.fleet, props.battle.roster)
      } else if (props.company.destroyed) {
        props.company.destroyed = false
        props.fleet.tas++
        recalculate(props.fleet, props.battle.roster)
      }
      store(props.battle)
    }

    function fuelChange() {
      props.company.outOfFuel = !props.company.outOfFuel
      if (props.company.outOfFuel) {
        props.fleet.tas--
      } else {
        props.fleet.tas++
      }
      recalculate(props.fleet, props.battle.roster)
      store(props.battle)
    }

    return {
      diceText: diceText,
      systemStateChange: systemStateChange,
      fuelChange: fuelChange,
    }
  },
  template: vueBattleCompanyTemplate,
}
