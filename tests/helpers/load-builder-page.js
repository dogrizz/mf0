import { click, mountPage, readSource, redraw } from './page.js'

const MITHRIL_SOURCE = readSource('node_modules/mithril/mithril.min.js')
const LZ_STRING_SOURCE = readSource('lz-string.min.js')
const SUPPORT_SOURCE = readSource('support.js')
const COMMON_SOURCE = readSource('common.js')
const BUILDER_SOURCE = readSource('builder.js')

// Loads the fleet builder page exactly the way index.html does (support.js -> common.js ->
// builder.js as classic, non-module scripts sharing one global scope), but with Mithril read
// from the locally vendored dev dependency instead of the CDN <script> tag index.html uses in
// production, so the characterization suite runs offline and deterministically.
export function mountBuilderPage() {
  return mountPage([MITHRIL_SOURCE, LZ_STRING_SOURCE, SUPPORT_SOURCE, COMMON_SOURCE, BUILDER_SOURCE])
}

export { click, redraw }

// Mirrors typing/selecting a value, then leaving the field - support.js and builder.js bind their
// state changes to `oninput`.
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
  return document.querySelector('.form-check-input')
}

// The scoreboard row (name/HVA/TAs/systems/PPA/total) rendered per player above the fleet builder
// accordion, in player order.
export function scoreboardRows(document) {
  const container = document.querySelector('.row.gap-3.border')
  return [...container.children].slice(1, -1)
}

// The fleet builder block (name, ships, "Add ship") rendered per player inside the accordion, in
// player order. Scoped under .accordion-body since a scoreboard row also matches the fleet
// container's own class list.
export function fleetElements(document) {
  return [...document.querySelector('.accordion-body .row-gap-1.row-cols-1').children]
}

export function addShipButton(fleetEl) {
  return fleetEl.querySelector('.btn-outline-success')
}

export function shipElements(fleetEl) {
  return [...fleetEl.querySelectorAll('.ship')]
}

export function shipClassSelect(shipEl) {
  return shipEl.querySelector('.ship-systems .mb-2 select')
}

// The per-slot system class dropdowns (Attack/Defence/Sensors/Catapult), excluding the ship class
// select above them.
export function systemSelects(shipEl) {
  return [...shipEl.querySelectorAll('.ship-systems > div:not(.mb-2) > select')]
}

export function diceText(shipEl) {
  return shipEl.querySelector('.col-2').textContent
}

export function hasMechCompany(shipEl) {
  return shipEl.textContent.includes('Mech company')
}
