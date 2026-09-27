import { click, mountPage, readSource, redraw, ROOT } from './page.js'

const VUE_SOURCE = readSource('node_modules/vue/dist/vue.global.js')
const LZ_STRING_SOURCE = readSource('lz-string.min.js')
const SUPPORT_COMMON_SOURCE = readSource('support/common.js')
const SUPPORT_STORAGE_SOURCE = readSource('support/storage.js')
const SUPPORT_BUILDER_SOURCE = readSource('support/builder.js')
const VUE_OPTIONS_LINK_SOURCE = readSource('shared/vue-options-link.js')
const VUE_APP_FOOTER_SOURCE = readSource('shared/vue-app-footer.js')
const VUE_BUILDER_SYSTEM_SOURCE = readSource('builder/components/vue-builder-system.js')
const VUE_BUILDER_MECH_COMPANIES_SOURCE = readSource('builder/components/vue-builder-mech-companies.js')
const VUE_BUILDER_SHIP_SOURCE = readSource('builder/components/vue-builder-ship.js')
const VUE_BUILDER_FLEET_SOURCE = readSource('builder/components/vue-builder-fleet.js')
const VUE_BUILDER_SHIP_TRACKER_SOURCE = readSource('builder/components/vue-builder-ship-tracker.js')
const VUE_BUILDER_PLAYER_SOURCE = readSource('builder/components/vue-builder-player.js')
const VUE_BUILDER_APP_SOURCE = readSource('builder/vue-builder-app.js')
const BUILDER_SOURCE = readSource('builder.js')

// Loads the fleet builder page exactly the way index.html does (support/common.js ->
// support/storage.js -> support/builder.js -> the Vue shared components -> builder.js as classic,
// non-module scripts sharing one global scope), but with Vue read from the locally vendored dev
// dependency instead of the CDN <script> tag index.html uses in production, so the
// characterization suite runs offline and deterministically.
//
// Every component's template is loaded via a synchronous XMLHttpRequest against this file's own
// on-disk `.template.html` sibling (see vue-builder-system.js for why); `xhrRoot` makes that
// resolve to the real file on disk without an actual HTTP server, while `url` stays
// `http://localhost/` (mountPage's default) rather than `file://` so this suite's
// localStorage-reading assertions keep working - jsdom refuses storage access for the "opaque"
// origin a `file://` document gets.
// `seedToolsState`, if given, is written to localStorage['mf0-tools'] before builder.js's own
// top-level script runs, so tests can exercise its page-load restore path (builder.js reads this
// key synchronously as soon as it's evaluated - see mountPage's `beforeScripts`).
export function mountBuilderPage({ seedToolsState } = {}) {
  const beforeScripts = seedToolsState
    ? `<script>localStorage.setItem('mf0-tools', ${JSON.stringify(JSON.stringify(seedToolsState))})</script>`
    : ''
  return mountPage(
    [
      VUE_SOURCE,
      LZ_STRING_SOURCE,
      SUPPORT_COMMON_SOURCE,
      SUPPORT_STORAGE_SOURCE,
      SUPPORT_BUILDER_SOURCE,
      VUE_OPTIONS_LINK_SOURCE,
      VUE_APP_FOOTER_SOURCE,
      VUE_BUILDER_SYSTEM_SOURCE,
      VUE_BUILDER_MECH_COMPANIES_SOURCE,
      VUE_BUILDER_SHIP_SOURCE,
      VUE_BUILDER_FLEET_SOURCE,
      VUE_BUILDER_SHIP_TRACKER_SOURCE,
      VUE_BUILDER_PLAYER_SOURCE,
      VUE_BUILDER_APP_SOURCE,
      BUILDER_SOURCE,
    ],
    { xhrRoot: ROOT, beforeScripts },
  )
}

export { click, redraw }

// Mirrors typing/selecting a value, then leaving the field - support/builder.js and builder.js
// bind their state changes to `oninput`.
export function setValue(el, value) {
  el.value = value
  el.dispatchEvent(new el.ownerDocument.defaultView.Event('input', { bubbles: true }))
}

export function readToolsState(dom) {
  const raw = dom.window.localStorage.getItem('mf0-tools')
  return raw === null ? null : JSON.parse(raw)
}

export function addPlayerButton(document) {
  return [...document.querySelectorAll('button')].find((b) => b.textContent === 'Add player')
}

export function syncCheckbox(document) {
  return document.querySelector('.sync-check')
}

// The scoreboard stat-card (name/HVA/TAs/systems/PPA/total) rendered per player, in player order.
export function scoreboardRows(document) {
  return [...document.querySelectorAll('.scoreboard .stat-card')]
}

// The fleet builder block (name, ships, "Add ship") rendered per player inside the fleet-builder
// disclosure (always in the DOM - see vue-builder-app.template.html's v-show - regardless of
// whether the disclosure is currently expanded), in player order.
export function fleetElements(document) {
  return [...document.querySelectorAll('.disclosure-body .fleet-section')]
}

export function addShipButton(fleetEl) {
  return fleetEl.querySelector('.btn-add')
}

export function shipElements(fleetEl) {
  return [...fleetEl.querySelectorAll('[data-kind="ship"]')]
}

export function shipClassSelect(shipEl) {
  return shipEl.querySelector('.ship-class-select')
}

// The per-slot system class dropdowns (Attack/Defence/Sensors/Catapult), excluding the attack-type
// dropdown(s) a slot reveals once it's set to Attack.
export function systemSelects(shipEl) {
  return [...shipEl.querySelectorAll('.system-slot-class-select')]
}

export function diceText(shipEl) {
  return shipEl.querySelector('.chip').textContent
}

export function hasMechCompany(shipEl) {
  return shipEl.querySelector('.ace-picker') !== null
}
