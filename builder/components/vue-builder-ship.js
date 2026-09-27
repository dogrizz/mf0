// Vue equivalent of builder.js's ShipComponent (Mithril): one ship card (name, copy/remove,
// dice notation, class select, system slots, mech companies).

var vueBuilderShipScriptUrl = document.currentScript.src || new URL('builder/components/vue-builder-ship.js', location.href).href

// Matches battle/components/vue-battle-ship.js's CLOSE_ICON_SVG - kept as its own copy here since
// builder.js and battle.js never share component files (see CLAUDE.md's architecture notes).
// Named per-file (not just REMOVE_ICON_SVG) because every builder component file is a classic,
// non-module <script> sharing one global scope (see CLAUDE.md's architecture notes) - a name
// reused across files would collide and silently pick whichever file loaded last.
var SHIP_REMOVE_ICON_SVG =
  '<svg viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'

var DUPLICATE_ICON_SVG =
  '<svg viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/></svg>'

var VueBuilderShipComponent = Vue.defineAsyncComponent(async () => {
  const templateUrl = new URL('vue-builder-ship.template.html', vueBuilderShipScriptUrl)
  const template = await fetch(templateUrl).then((response) => response.text())

  return {
    props: {
      ship: { type: Object, required: true },
      fleet: { type: Object, required: true },
    },
    setup: function (props) {
      function changeClass(newClass) {
        if (setShipClass(props.ship, newClass)) {
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
        removeShip(props.fleet, props.ship)
        recalculatePPA()
      }

      function duplicate() {
        duplicateShip(props.fleet, props.ship)
        recalculatePPA()
      }

      var diceSegments = Vue.computed(function () {
        return builderDice(props.ship)
      })

      return {
        ShipType: ShipType,
        diceSegments: diceSegments,
        changeName: changeName,
        changeClass: changeClass,
        remove: remove,
        duplicate: duplicate,
        removeIconSvg: SHIP_REMOVE_ICON_SVG,
        duplicateIconSvg: DUPLICATE_ICON_SVG,
      }
    },
    template,
  }
})
