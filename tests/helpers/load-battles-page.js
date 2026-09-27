import { click, mountPage, readSource, redraw, ROOT } from './page.js'

const VUE_SOURCE = readSource('node_modules/vue/dist/vue.global.js')
const SUPPORT_COMMON_SOURCE = readSource('support/common.js')
const SUPPORT_STORAGE_SOURCE = readSource('support/storage.js')
const VUE_OPTIONS_LINK_SOURCE = readSource('shared/vue-options-link.js')
const VUE_APP_FOOTER_SOURCE = readSource('shared/vue-app-footer.js')
const VUE_BATTLES_APP_SOURCE = readSource('battles/vue-battles-app.js')
const BATTLES_SOURCE = readSource('battles.js')

const BATTLE_STORAGE_KEY = 'mf0-battles'

// Loads the battles list page exactly the way battles.html does (support/common.js ->
// support/storage.js -> the Vue shared components -> battles/vue-battles-app.js -> battles.js as
// classic, non-module scripts sharing one global scope), but with Vue read from the locally
// vendored dev dependency instead of the CDN <script> tag battles.html uses in production - see
// tests/helpers/load-builder-page.js (ticket 08) for why (offline, deterministic characterization
// suite). battles.html doesn't load lz-string.min.js itself - the battles list never decompresses
// battle data, only battle.html does - so it's omitted here too.
//
// Every component's template is loaded via a synchronous XMLHttpRequest against this file's own
// on-disk `.template.html` sibling (see builder/components/vue-builder-system.js); `xhrRoot` makes
// that resolve to the real file on disk without an actual HTTP server, while `url` stays
// `http://localhost/` (mountPage's default) rather than `file://` so this suite's
// localStorage-reading assertions keep working - jsdom refuses storage access for the "opaque"
// origin a `file://` document gets.
//
// `battles`, when given, seeds localStorage['mf0-battles'] with a script that runs before
// battles.js reads it via readBattles(), mirroring a page load where a previous session already
// saved battles, since Vue.createApp(...).mount happens synchronously as the last statement of
// battles.js.
export function mountBattlesPage(battles) {
  const beforeScripts =
    battles === undefined
      ? ''
      : `<script>localStorage.setItem(${JSON.stringify(BATTLE_STORAGE_KEY)}, ${JSON.stringify(JSON.stringify(battles))})</script>`

  return mountPage(
    [
      VUE_SOURCE,
      SUPPORT_COMMON_SOURCE,
      SUPPORT_STORAGE_SOURCE,
      VUE_OPTIONS_LINK_SOURCE,
      VUE_APP_FOOTER_SOURCE,
      VUE_BATTLES_APP_SOURCE,
      BATTLES_SOURCE,
    ],
    { beforeScripts, xhrRoot: ROOT },
  )
}

export { click, redraw }

export function readBattlesState(dom) {
  const raw = dom.window.localStorage.getItem(BATTLE_STORAGE_KEY)
  return raw === null ? null : JSON.parse(raw)
}

// One rendered card per saved battle (date, Resume link, Forfeit button), in the order
// `Object.entries` yields them.
export function battleRows(document) {
  return [...document.querySelectorAll('.battle-card')]
}

export function resumeLink(rowEl) {
  return rowEl.querySelector('a.btn-primary')
}

export function forfeitButton(rowEl) {
  return rowEl.querySelector('button.btn-danger')
}

export function emptyStateMessage(document) {
  return document.querySelector('.empty-state-message')
}
