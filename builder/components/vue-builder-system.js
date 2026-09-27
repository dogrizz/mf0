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

// Inline stroke icons for each ShipSystem class a build-time slot can be set to, matching the
// tactical redesign's icon-per-class language (see battle/components/vue-battle-ship.js's
// SHIP_SYSTEM_ICONS) - kept as its own copy here since builder.js and battle.js never share
// component files (see CLAUDE.md's architecture notes). An empty slot (class === '') renders no
// icon. Rendered via v-html in the template - safe here since the source is always one of these
// four fixed strings, never user-controlled data.
var SYSTEM_SLOT_ICONS = {
  attack:
    '<svg viewBox="0 0 16 16" fill="none"><path d="M2 14L14 2M14 2H8M14 2V8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  defense:
    '<svg viewBox="0 0 16 16" fill="none"><path d="M8 1.5L14 4V8C14 11.5 11.5 13.8 8 14.5C4.5 13.8 2 11.5 2 8V4L8 1.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  sensor:
    '<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" fill="currentColor"/><path d="M4.5 4.5a5 5 0 000 7M11.5 4.5a5 5 0 010 7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  catapult:
    '<svg viewBox="0 0 16 16" fill="none"><path d="M3 13h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M8 12V2M8 2L5 5M8 2l3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
}

// Named per-file (not just ADD_ICON_SVG/REMOVE_ICON_SVG) because every builder component file is a
// classic, non-module <script> sharing one global scope (see CLAUDE.md's architecture notes) - a
// name reused across files would collide and silently pick whichever file loaded last.
var SYSTEM_SLOT_ADD_ICON_SVG =
  '<svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'

var SYSTEM_SLOT_REMOVE_ICON_SVG =
  '<svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'

function systemSlotIcon(systemClass) {
  return SYSTEM_SLOT_ICONS[systemClass] || ''
}

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
      AttackTypeLabels: ATTACK_TYPE_LABELS,
      secondSystem: secondSystem,
      changeClass: changeClass,
      changeAttackType: changeAttackType,
      changeAttackType2: changeAttackType2,
      flipSecondSystem: flipSecondSystem,
      systemIcon: systemSlotIcon,
      addIconSvg: SYSTEM_SLOT_ADD_ICON_SVG,
      removeIconSvg: SYSTEM_SLOT_REMOVE_ICON_SVG,
    }
  },
  template: vueBuilderSystemTemplate,
}
