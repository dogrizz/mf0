// Vue equivalent of battle.js's `main` object (Mithril): the battle tracker page's root - nav
// link, per-fleet scoreboard, ship tracker (when the handed-off battle synced ship data), footer.

var vueBattleAppScriptUrl = document.currentScript.src || new URL('battle/vue-battle-app.js', location.href).href

var VueBattleAppComponent = Vue.defineAsyncComponent(async () => {
  const templateUrl = new URL('vue-battle-app.template.html', vueBattleAppScriptUrl)
  const template = await fetch(templateUrl).then((response) => response.text())

  return {
    props: {
      state: { type: Object, required: true },
    },
    setup: function () {
      return {
        fleetAccent: fleetAccentColor,
      }
    },
    template,
  }
})
