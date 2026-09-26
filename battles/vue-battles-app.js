// Vue equivalent of battles.js's `main` object (Mithril): the battles list page's root - nav
// link (with the "Saved battles" link itself hidden, since we're already on that page), one row
// per saved battle with a resume link and forfeit button, or an empty-state message, footer. See
// builder/vue-builder-app.js (ticket 08) for why this component's template is loaded via
// synchronous XHR rather than the fetch()+defineAsyncComponent pattern from ticket 07 - true for
// every component on this page, and load order matters most for the root since it's what
// battles.js mounts directly.

var vueBattlesAppTemplate = (function () {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', 'battles/vue-battles-app.template.html', false)
  xhr.send(null)
  return xhr.responseText
})()

var VueBattlesAppComponent = {
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

    return {
      resumeHref: resumeHref,
      forfeit: forfeit,
    }
  },
  template: vueBattlesAppTemplate,
}
