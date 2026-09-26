;(function () {
  var battleState = Vue.reactive({ battle: null })

  var params = new URLSearchParams(window.location.search)
  if (params.has(BATTLE_ID_PARAM)) {
    battleState.battle = readBattle(params.get(BATTLE_ID_PARAM))
  }

  var app = Vue.createApp(VueBattleAppComponent, { state: battleState })
  app.component('options-link', VueOptionsLinkComponent)
  app.component('app-footer', VueAppFooterComponent)
  app.component('battle-player', VueBattlePlayerComponent)
  app.component('battle-fleet', VueBattleFleetComponent)
  app.component('battle-ship', VueBattleShipComponent)
  app.component('battle-company', VueBattleCompanyComponent)
  app.mount(document.body)
})()
