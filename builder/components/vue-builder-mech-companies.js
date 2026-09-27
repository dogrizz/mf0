// Vue equivalent of builder.js's MechCompanies (Mithril): the ace-selection block shown per ship
// once it has at least one catapult system.

var vueBuilderMechCompaniesScriptUrl =
  document.currentScript.src || new URL('builder/components/vue-builder-mech-companies.js', location.href).href

// The ace-type picker shows ace color as a swatch rather than text alone (tactical redesign
// ticket 02), reusing the same red/blue/yellow hues the redesign already assigns to
// danger/focus/warning status elsewhere, plus success-green for the "green ace" option not
// otherwise represented in the palette.
var ACE_TYPES = [
  { value: 'red', label: 'Red ace', color: 'var(--tac-danger)' },
  { value: 'blue', label: 'Blue ace', color: 'var(--tac-focus)' },
  { value: 'green', label: 'Green ace', color: 'var(--tac-success)' },
  { value: 'yellow', label: 'Yellow ace', color: 'var(--tac-warning)' },
]

// Stylized mobile-suit head (V-fin crest, angular face plate, visor slit) standing in for a plain
// color dot on the ace swatch buttons - an ace pilot is a named mech pilot, so the icon leans into
// the game's mecha theme rather than a generic status dot. Colored via the swatch's `color` style
// (see the template) same as every other stroke icon on the page.
var ACE_ICON_SVG =
  '<svg viewBox="0 0 16 16" fill="none"><path d="M6 5L8 2L10 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 5H11.5L11 8.5L8 12L5 8.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M5.8 7.4H10.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>'

var VueBuilderMechCompaniesComponent = Vue.defineAsyncComponent(async () => {
  const templateUrl = new URL('vue-builder-mech-companies.template.html', vueBuilderMechCompaniesScriptUrl)
  const template = await fetch(templateUrl).then((response) => response.text())

  return {
    props: {
      ship: { type: Object, required: true },
      fleet: { type: Object, required: true },
    },
    setup: function (props) {
      var catapults = Vue.computed(function () {
        if (!props.ship.hasOwnProperty('systems')) {
          return []
        }
        return props.ship.systems.filter(function (system) {
          return system.class === ShipSystem.CATAPULT
        })
      })

      // One mech company deploys per catapult (see support/battle.js's buildCompanyData) - this
      // label previously always read the static singular "Mech company" regardless of how many
      // catapults the ship actually had.
      var mechCompanyLabel = Vue.computed(function () {
        return pluralize(catapults.value.length, 'Mech company', 'Mech companies')
      })

      function setAce(hasAce) {
        setShipAce(props.ship, props.fleet, hasAce)
        saveState()
      }

      function changeAceType(newType) {
        setShipAceType(props.ship, newType)
        saveState()
      }

      return {
        catapults: catapults,
        mechCompanyLabel: mechCompanyLabel,
        setAce: setAce,
        changeAceType: changeAceType,
        aceTypes: ACE_TYPES,
        aceIconSvg: ACE_ICON_SVG,
      }
    },
    template,
  }
})
