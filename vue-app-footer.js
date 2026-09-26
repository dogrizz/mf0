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

// The `|| location.href` fallback only matters under a test harness that inlines this file as a
// same-document <script> body rather than loading it via a real <script src>: an inline script's
// currentScript.src is always '', which new URL() below would otherwise reject as an invalid
// base. Production always loads this file via a real src attribute, so currentScript.src is never
// empty there and this fallback never applies.
var appFooterScriptUrl = document.currentScript.src || location.href

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
