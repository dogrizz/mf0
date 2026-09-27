// Vue equivalent of battle.js's FleetComponent (Mithril): one fleet's ships and mech companies
// during a battle.

var vueBattleFleetScriptUrl = document.currentScript.src || new URL('battle/components/vue-battle-fleet.js', location.href).href

function pluralize(count, singular, plural) {
  return count + ' ' + (count === 1 ? singular : plural)
}

var VueBattleFleetComponent = Vue.defineAsyncComponent(async () => {
  const templateUrl = new URL('vue-battle-fleet.template.html', vueBattleFleetScriptUrl)
  const template = await fetch(templateUrl).then((response) => response.text())

  return {
    props: {
      fleet: { type: Object, required: true },
      battle: { type: Object, required: true },
      accent: { type: String, required: true },
    },
    setup: function (props) {
      var meta = Vue.computed(function () {
        return (
          pluralize(props.fleet.ships.length, 'ship', 'ships') + ' · ' + pluralize(props.fleet.companies.length, 'company', 'companies')
        )
      })

      return {
        meta: meta,
      }
    },
    template,
  }
})
