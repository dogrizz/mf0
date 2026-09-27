// Vue equivalent of battle.js's `main` object (Mithril): the battle tracker page's root - nav
// link, per-fleet scoreboard, ship tracker (when the handed-off battle synced ship data), footer.
// See builder/vue-builder-app.js (ticket 08) for why this component's template is loaded via
// synchronous XHR rather than the fetch()+defineAsyncComponent pattern from ticket 07 - true for
// every component on this page, and load order matters most for the root since it's what
// battle.js mounts directly.

var vueBattleAppTemplate = (function () {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', 'battle/vue-battle-app.template.html', false)
  xhr.send(null)
  return xhr.responseText
})()

var VueBattleAppComponent = {
  props: {
    state: { type: Object, required: true },
  },
  setup: function () {
    return {
      fleetAccent: fleetAccentColor,
    }
  },
  template: vueBattleAppTemplate,
}
