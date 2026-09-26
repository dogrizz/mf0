import { click, mountPage, readSource, redraw, ROOT } from './page.js'

const VUE_SOURCE = readSource('node_modules/vue/dist/vue.global.js')
const LZ_STRING_SOURCE = readSource('lz-string.min.js')
const SUPPORT_SOURCE = readSource('support.js')
const VUE_OPTIONS_LINK_SOURCE = readSource('shared/vue-options-link.js')
const VUE_APP_FOOTER_SOURCE = readSource('shared/vue-app-footer.js')
const VUE_BATTLE_PLAYER_SOURCE = readSource('battle/components/vue-battle-player.js')
const VUE_BATTLE_SHIP_SOURCE = readSource('battle/components/vue-battle-ship.js')
const VUE_BATTLE_COMPANY_SOURCE = readSource('battle/components/vue-battle-company.js')
const VUE_BATTLE_FLEET_SOURCE = readSource('battle/components/vue-battle-fleet.js')
const VUE_BATTLE_APP_SOURCE = readSource('battle/vue-battle-app.js')
const BATTLE_SOURCE = readSource('battle.js')

// Loads the battle tracker page exactly the way battle.html does (support.js -> the Vue shared
// components -> the battle-specific components -> battle.js as classic, non-module scripts
// sharing one global scope), but with Vue read from the locally vendored dev dependency instead
// of the CDN <script> tag battle.html uses in production - see tests/helpers/load-builder-page.js
// (ticket 08) for why (offline, deterministic characterization suite).
//
// A battle is handed to battle.html the same way the fleet builder hands one off in real use: by
// calling storeBattle() (and thus populating localStorage['mf0-battles']) before battle.js reads
// `battleId` from the URL and calls readBattle(). Since a fresh JSDOM's localStorage can't be
// pre-seeded from outside, an inline seed script that calls the real storeBattle() is spliced in
// between support.js and the page's own scripts, using an explicit id so the URL's `battleId`
// query param can be fixed ahead of time.
//
// Every component's template is loaded via a synchronous XMLHttpRequest against this file's own
// on-disk `.template.html` sibling (see builder/components/vue-builder-system.js); `xhrRoot` makes
// that resolve to the real file on disk without an actual HTTP server, while `url` stays
// `http://localhost/battle.html?battleId=<id>` (rather than `file://`) so this suite's
// localStorage-reading assertions keep working - jsdom refuses storage access for the "opaque"
// origin a `file://` document gets.
export function mountBattlePage({ roster, battleId = 1, track = true, sync = true }) {
  const seedScript = `(function () { storeBattle(${JSON.stringify(roster)}, ${track}, ${sync}, ${battleId}) })()`

  return mountPage(
    [
      VUE_SOURCE,
      LZ_STRING_SOURCE,
      SUPPORT_SOURCE,
      VUE_OPTIONS_LINK_SOURCE,
      VUE_APP_FOOTER_SOURCE,
      VUE_BATTLE_PLAYER_SOURCE,
      VUE_BATTLE_SHIP_SOURCE,
      VUE_BATTLE_COMPANY_SOURCE,
      VUE_BATTLE_FLEET_SOURCE,
      VUE_BATTLE_APP_SOURCE,
      seedScript,
      BATTLE_SOURCE,
    ],
    { xhrRoot: ROOT, url: `http://localhost/battle.html?battleId=${battleId}` },
  )
}

export { click, redraw }

export function readBattleState(dom, battleId = 1) {
  const raw = dom.window.localStorage.getItem('mf0-battles')
  if (raw === null) {
    return null
  }
  const entry = JSON.parse(raw)[battleId]
  if (!entry) {
    return null
  }
  return JSON.parse(dom.window.LZString.decompress(entry.data))
}

export function fleetElements(document) {
  return [...document.querySelectorAll('.bg-dark-subtle')]
}

export function fleetName(fleetEl) {
  return fleetEl.querySelector('h3').textContent
}

export function shipElements(fleetEl) {
  return [...fleetEl.querySelectorAll('.ship')]
}

export function companyElements(fleetEl) {
  return [...fleetEl.querySelectorAll('.company')]
}

export function isDead(el) {
  return el.classList.contains('dead')
}

export function isCaptured(shipEl) {
  return shipEl.querySelector('h4').classList.contains('captured')
}

export function transferButton(shipEl) {
  return shipEl.querySelector('.btn-outline-info')
}

export function fuelButton(companyEl) {
  return companyEl.querySelector('.btn-outline-warning')
}

// Finds a system checkbox by its rendered label text (e.g. 'internal', 'defense', 'weapon') -
// scoped to a ship or company element, since both render one label+checkbox pair per system.
export function systemCheckbox(el, labelText) {
  const label = [...el.querySelectorAll('label.form-check-label')].find((l) => l.textContent.trim().startsWith(labelText))
  if (!label) {
    throw new Error(`no system labeled "${labelText}" found`)
  }
  return label.querySelector('input[type="checkbox"]')
}

export function systemCheckboxes(el) {
  return [...el.querySelectorAll('label.form-check-label input[type="checkbox"]')]
}
