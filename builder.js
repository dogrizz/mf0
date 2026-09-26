;(function () {
  var LOCAL_STORAGE_KEY = 'mf0-tools'

  var builderState = Vue.reactive({ players: [], track: false, sync: false })

  function saveState() {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ players: builderState.players, track: builderState.track, sync: builderState.sync }),
    )
  }

  function recalculatePPA() {
    calculatePPA(builderState.players, builderState.sync)
    saveState()
  }

  // Exposed as globals (var, not const - see common.js's convention) so every component's logic
  // file, each its own classic script sharing this page's global scope, can call them the same
  // way builder.js's Mithril components used to call their own module-scoped versions.
  window.saveState = saveState
  window.recalculatePPA = recalculatePPA

  var oldData = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (oldData !== null) {
    var data = JSON.parse(oldData)
    builderState.players = data.players
    builderState.sync = data.sync
    builderState.track = data.track
  }

  var app = Vue.createApp(VueBuilderAppComponent, { state: builderState })
  app.component('options-link', VueOptionsLinkComponent)
  app.component('app-footer', VueAppFooterComponent)
  app.component('builder-ship-tracker', VueBuilderShipTrackerComponent)
  app.component('builder-fleet', VueBuilderFleetComponent)
  app.component('builder-ship', VueBuilderShipComponent)
  app.component('builder-mech-companies', VueBuilderMechCompaniesComponent)
  app.component('builder-system', VueBuilderSystemComponent)
  app.component('builder-player', VueBuilderPlayerComponent)
  app.mount(document.body)
})()
