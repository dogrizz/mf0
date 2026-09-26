// Vue equivalent of common.js's FooterComponent (Mithril). Temporary duplicate that
// coexists with common.js until every page has migrated to Vue (ticket 10).
//
// Requires Vue 3's CDN "global build" to be loaded first, e.g.:
//   <script src="https://unpkg.com/vue@3.5.43/dist/vue.global.js"></script>
//
// The template fetch below requires the page to be served over http(s) — Chrome and
// Firefox block fetch() against file:// URLs. Once a page adopts this component (ticket
// 10), local dev must use a static file server (e.g. `python3 -m http.server`) rather
// than opening the .html file directly.

var appFooterScriptUrl = document.currentScript.src

var VueAppFooterComponent = Vue.defineAsyncComponent(async () => {
  const templateUrl = new URL('vue-app-footer.template.html', appFooterScriptUrl)
  const template = await fetch(templateUrl).then((response) => response.text())

  return {
    setup() {
      return {}
    },
    template,
  }
})
