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

// Inline stroke icons for each MechSystem class, matching the tactical redesign mockup (see
// .scratch/tactical-redesign/issues/01-battle-tracker-tactical-redesign.md). Rendered via v-html
// in the template - safe here since the source is always one of these five fixed strings, never
// user-controlled data.
var MECH_SYSTEM_ICONS = {
  system:
    '<svg viewBox="0 0 16 16" fill="none"><rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M6 8h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  weapon:
    '<svg viewBox="0 0 16 16" fill="none"><path d="M2 14L14 2M14 2H8M14 2V8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  defense:
    '<svg viewBox="0 0 16 16" fill="none"><path d="M8 1.5L14 4V8C14 11.5 11.5 13.8 8 14.5C4.5 13.8 2 11.5 2 8V4L8 1.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  comm: '<svg viewBox="0 0 16 16" fill="none"><path d="M3 9a5 5 0 0110 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="12.5" r="1.2" fill="currentColor"/></svg>',
  movement:
    '<svg viewBox="0 0 16 16" fill="none"><path d="M3 5l4 3-4 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 5l4 3-4 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
}

var FUEL_ICON_SVG =
  '<svg viewBox="0 0 20 20" fill="none"><rect x="4" y="3" width="9" height="14" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M13 8h1.5a1.5 1.5 0 011.5 1.5V13a1 1 0 001 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M7 7h5v4H7z" stroke="currentColor" stroke-width="1.3"/></svg>'

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

    function systemIcon(systemClass) {
      return MECH_SYSTEM_ICONS[systemClass] || ''
    }

    function systemStateChange(system, newState) {
      applySystemDamage(props.company, props.fleet, props.battle.roster, system, newState)
    }

    function fuelChange() {
      toggleCompanyFuel(props.company, props.fleet, props.battle.roster)
    }

    return {
      diceText: diceText,
      systemIcon: systemIcon,
      systemStateChange: systemStateChange,
      fuelChange: fuelChange,
      fuelIconSvg: FUEL_ICON_SVG,
    }
  },
  template: vueBattleCompanyTemplate,
}
