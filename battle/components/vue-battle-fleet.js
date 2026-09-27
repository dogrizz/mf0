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

var VueBattleFleetComponent = {
  props: {
    fleet: { type: Object, required: true },
    battle: { type: Object, required: true },
    index: { type: Number, default: 0 },
  },
  setup: function (props) {
    // FLEET_COLORS is defined once in vue-battle-player.js (loaded earlier in battle.html's script
    // order) so a fleet's scoreboard card and its ships/companies section agree on its dot color.
    var fleetColor = Vue.computed(function () {
      return FLEET_COLORS[props.index % FLEET_COLORS.length]
    })

    var meta = Vue.computed(function () {
      var ships = props.fleet.ships.length
      var companies = props.fleet.companies.length
      return ships + (ships === 1 ? ' ship' : ' ships') + ' · ' + companies + (companies === 1 ? ' company' : ' companies')
    })

    return {
      fleetColor: fleetColor,
      meta: meta,
    }
  },
  template: vueBattleFleetTemplate,
}
