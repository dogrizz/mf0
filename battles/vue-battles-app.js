// Vue equivalent of battles.js's `main` object (Mithril): the battles list page's root - nav
// link (with the "Saved battles" link itself hidden, since we're already on that page), one card
// per saved battle with a resume link and forfeit button, or an empty-state message, footer.

var vueBattlesAppScriptUrl = document.currentScript.src || new URL('battles/vue-battles-app.js', location.href).href

var VueBattlesAppComponent = Vue.defineAsyncComponent(async () => {
  const templateUrl = new URL('vue-battles-app.template.html', vueBattlesAppScriptUrl)
  const template = await fetch(templateUrl).then((response) => response.text())

  return {
    props: {
      state: { type: Object, required: true },
    },
    setup: function (props) {
      function resumeHref(id) {
        return 'battle.html?' + BATTLE_ID_PARAM + '=' + id
      }

      function forfeit(id) {
        forfeitBattle(props.state.battles, id)
      }

      // Each row's label plus its two aria-labels all need the same formatted date; computed here
      // once per battle so a re-render (e.g. after forfeiting a different row) doesn't re-run
      // `toLocaleString()` three times per remaining row.
      var battleList = Vue.computed(function () {
        var battles = props.state.battles || {}
        return Object.keys(battles).map(function (id) {
          return { id: id, date: new Date(battles[id].date).toLocaleString() }
        })
      })

      return {
        resumeHref: resumeHref,
        forfeit: forfeit,
        battleList: battleList,
      }
    },
    template,
  }
})
