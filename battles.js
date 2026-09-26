;(function () {
  var battlesState = Vue.reactive({ battles: readBattles() })

  var app = Vue.createApp(VueBattlesAppComponent, { state: battlesState })
  app.component('options-link', VueOptionsLinkComponent)
  app.component('app-footer', VueAppFooterComponent)
  app.mount(document.body)
})()
