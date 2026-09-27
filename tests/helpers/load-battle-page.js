import { click, mountPage, readSource, redraw, ROOT, setValue } from './page.js'

const VUE_SOURCE = readSource('node_modules/vue/dist/vue.global.js')
const LZ_STRING_SOURCE = readSource('lz-string.min.js')
const SUPPORT_COMMON_SOURCE = readSource('support/common.js')
const SUPPORT_STORAGE_SOURCE = readSource('support/storage.js')
const SUPPORT_BATTLE_SOURCE = readSource('support/battle.js')
const VUE_OPTIONS_LINK_SOURCE = readSource('shared/vue-options-link.js')
const VUE_APP_FOOTER_SOURCE = readSource('shared/vue-app-footer.js')
const VUE_BATTLE_PLAYER_SOURCE = readSource('battle/components/vue-battle-player.js')
const VUE_BATTLE_SHIP_SOURCE = readSource('battle/components/vue-battle-ship.js')
const VUE_BATTLE_COMPANY_SOURCE = readSource('battle/components/vue-battle-company.js')
const VUE_BATTLE_FLEET_SOURCE = readSource('battle/components/vue-battle-fleet.js')
const VUE_BATTLE_APP_SOURCE = readSource('battle/vue-battle-app.js')
const BATTLE_SOURCE = readSource('battle.js')

// Loads the battle tracker page exactly the way battle.html does (support/common.js ->
// support/storage.js -> support/battle.js -> the Vue shared components -> the battle-specific
// components -> battle.js as classic, non-module scripts sharing one global scope), but with Vue
// read from the locally vendored dev dependency instead of the CDN <script> tag battle.html uses
// in production - see tests/helpers/load-builder-page.js (ticket 08) for why (offline,
// deterministic characterization suite).
//
// A battle is handed to battle.html the same way the fleet builder hands one off in real use: by
// calling storeBattle() (and thus populating localStorage['mf0-battles']) before battle.js reads
// `battleId` from the URL and calls readBattle(). Since a fresh JSDOM's localStorage can't be
// pre-seeded from outside, an inline seed script that calls the real storeBattle() is spliced in
// between the support/*.js files and the page's own scripts, using an explicit id so the URL's
// `battleId` query param can be fixed ahead of time.
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
      SUPPORT_COMMON_SOURCE,
      SUPPORT_STORAGE_SOURCE,
      SUPPORT_BATTLE_SOURCE,
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

export { click, redraw, setValue }

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
  return [...document.querySelectorAll('.fleet-section')]
}

// The scoreboard's per-fleet stat cards (name, HVA/TAs inputs, PPA/total readouts, role badge) -
// rendered separately from .fleet-section, in roster order.
export function playerCards(document) {
  return [...document.querySelectorAll('.scoreboard .stat-card')]
}

export function hvaInput(cardEl) {
  return cardEl.querySelectorAll('input')[0]
}

export function tasInput(cardEl) {
  return cardEl.querySelectorAll('input')[1]
}

export function playerTotal(cardEl) {
  return Number(cardEl.querySelectorAll('.stat-readout-value')[1].textContent)
}

export function playerRole(cardEl) {
  return cardEl.querySelector('.badge').textContent.trim()
}

export function fleetName(fleetEl) {
  return fleetEl.querySelector('h2').textContent
}

export function shipElements(fleetEl) {
  return [...fleetEl.querySelectorAll('[data-kind="ship"]')]
}

export function companyElements(fleetEl) {
  return [...fleetEl.querySelectorAll('[data-kind="company"]')]
}

export function isDead(el) {
  return el.classList.contains('is-dead')
}

export function isCaptured(shipEl) {
  return shipEl.querySelector('.asset-name').classList.contains('captured')
}

export function transferButton(shipEl) {
  return shipEl.querySelector('.icon-btn[aria-label="Transfer ship"]')
}

export function fuelButton(companyEl) {
  return companyEl.querySelector('.icon-btn[aria-label="Toggle fuel state"]')
}

// Finds a system checkbox by its rendered label text (e.g. 'internal', 'defense', 'weapon') -
// scoped to a ship or company element, since both render one system-row per system.
export function systemCheckbox(el, labelText) {
  const row = [...el.querySelectorAll('.system-row')].find((r) => r.querySelector('.system-label').textContent.trim().startsWith(labelText))
  if (!row) {
    throw new Error(`no system labeled "${labelText}" found`)
  }
  return row.querySelector('.system-check')
}

export function systemCheckboxes(el) {
  return [...el.querySelectorAll('.system-row .system-check')]
}
