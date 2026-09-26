import { click, mountPage, readSource, redraw } from './page.js'

const MITHRIL_SOURCE = readSource('node_modules/mithril/mithril.min.js')
const SUPPORT_SOURCE = readSource('support.js')
const COMMON_SOURCE = readSource('common.js')
const BATTLES_SOURCE = readSource('battles.js')

const BATTLE_STORAGE_KEY = 'mf0-battles'

// Loads the battles list page exactly the way battles.html does (support.js -> common.js ->
// battles.js as classic, non-module scripts sharing one global scope), but with Mithril read from
// the locally vendored dev dependency instead of the CDN <script> tag battles.html uses in
// production, so the characterization suite runs offline and deterministically. battles.html
// doesn't load lz-string.min.js itself - the battles list never decompresses battle data, only
// battle.html does - so it's omitted here too.
//
// `battles`, when given, seeds localStorage['mf0-battles'] with a script that runs before
// battles.js's oninit reads it (mirroring a page load where a previous session already saved
// battles), since m.mount happens synchronously as the last statement of battles.js.
export function mountBattlesPage(battles) {
  const beforeScripts =
    battles === undefined
      ? ''
      : `<script>localStorage.setItem(${JSON.stringify(BATTLE_STORAGE_KEY)}, ${JSON.stringify(JSON.stringify(battles))})</script>`

  return mountPage([MITHRIL_SOURCE, SUPPORT_SOURCE, COMMON_SOURCE, BATTLES_SOURCE], { beforeScripts })
}

export { click, redraw }

export function readBattlesState(dom) {
  const raw = dom.window.localStorage.getItem(BATTLE_STORAGE_KEY)
  return raw === null ? null : JSON.parse(raw)
}

// The container battles are listed in - matched on both classes since each individual battle row
// also carries the shared `battle` class.
function battlesContainer(document) {
  return document.querySelector('.battle.list')
}

// One rendered row per saved battle (date, Resume link, Forfeit button), in the order
// `Object.entries` yields them.
export function battleRows(document) {
  return [...document.querySelectorAll('.battle.col')]
}

export function resumeLink(rowEl) {
  return rowEl.querySelector('a.btn-outline-success')
}

export function forfeitButton(rowEl) {
  return rowEl.querySelector('button.btn-outline-danger')
}

export function emptyStateMessage(document) {
  return battlesContainer(document).querySelector('span')
}
