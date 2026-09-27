;(function () {
  var battleState = Vue.reactive({ battle: null })

  var params = new URLSearchParams(window.location.search)
  if (params.has(BATTLE_ID_PARAM)) {
    battleState.battle = readBattle(params.get(BATTLE_ID_PARAM))
  }

  // Every battle-mutating component (vue-battle-player.js, vue-battle-ship.js,
  // vue-battle-company.js) used to call store(props.battle) itself right after mutating - six
  // near-identical call sites all doing the same "persist the whole battle" step. One deep watch
  // here does it instead, for any mutation anywhere in the battle. Unlike those call sites, this
  // flushes on Vue's microtask scheduler rather than synchronously within the click handler - no
  // observable difference for normal use (it flushes before the browser moves on to the next
  // task, e.g. a link click), but it's no longer a same-tick guarantee.
  Vue.watch(
    () => battleState.battle,
    () => store(battleState.battle),
    { deep: true },
  )

  var app = Vue.createApp(VueBattleAppComponent, { state: battleState })
  app.component('options-link', VueOptionsLinkComponent)
  app.component('app-footer', VueAppFooterComponent)
  app.component('battle-player', VueBattlePlayerComponent)
  app.component('battle-fleet', VueBattleFleetComponent)
  app.component('battle-ship', VueBattleShipComponent)
  app.component('battle-company', VueBattleCompanyComponent)
  app.mount(document.body)
})()
