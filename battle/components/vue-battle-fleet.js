// Vue equivalent of battle.js's FleetComponent (Mithril): one fleet's ships and mech companies
// during a battle. See builder/components/vue-builder-system.js (ticket 08) for why this
// component's template is loaded via synchronous XHR rather than the fetch()+
// defineAsyncComponent pattern from ticket 07.

var vueBattleFleetTemplate = (function () {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', 'battle/components/vue-battle-fleet.template.html', false)
  xhr.send(null)
  return xhr.responseText
})()

function pluralize(count, singular, plural) {
  return count + ' ' + (count === 1 ? singular : plural)
}

var VueBattleFleetComponent = {
  props: {
    fleet: { type: Object, required: true },
    battle: { type: Object, required: true },
    accent: { type: String, required: true },
  },
  setup: function (props) {
    var meta = Vue.computed(function () {
      return pluralize(props.fleet.ships.length, 'ship', 'ships') + ' · ' + pluralize(props.fleet.companies.length, 'company', 'companies')
    })

    return {
      meta: meta,
    }
  },
  template: vueBattleFleetTemplate,
}
