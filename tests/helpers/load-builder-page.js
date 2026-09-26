import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8')
}

const MITHRIL_SOURCE = read('node_modules/mithril/mithril.min.js')
const LZ_STRING_SOURCE = read('lz-string.min.js')
const SUPPORT_SOURCE = read('support.js')
const COMMON_SOURCE = read('common.js')
const BUILDER_SOURCE = read('builder.js')

function inlineScript(source) {
  // Closing-script-tag sequences can't appear inside an inline <script> body.
  return `<script>${source.replace(/<\/script>/gi, '<\\/script>')}</script>`
}

// Loads the fleet builder page exactly the way index.html does (support.js -> common.js ->
// builder.js as classic, non-module scripts sharing one global scope), but with Mithril read
// from the locally vendored dev dependency instead of the CDN <script> tag index.html uses in
// production, so the characterization suite runs offline and deterministically.
//
// The sources are inlined as real <script> elements (rather than run one-by-one via
// window.eval) because jsdom only threads top-level `const`/`let` bindings - such as support.js's
// `ShipSystem`/`ShipType` - across scripts that are parsed and run together as part of the same
// document, matching how a browser shares one global lexical scope across <script> tags.
export function mountBuilderPage() {
  const html = `<!doctype html><html><body data-bs-theme="dark">${inlineScript(MITHRIL_SOURCE)}${inlineScript(LZ_STRING_SOURCE)}${inlineScript(SUPPORT_SOURCE)}${inlineScript(COMMON_SOURCE)}${inlineScript(BUILDER_SOURCE)}</body></html>`

  return new JSDOM(html, {
    url: 'http://localhost/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
  })
}

// Mithril batches DOM updates from event handlers into the next animation frame, so tests must
// wait a frame after dispatching an event before asserting on the re-rendered DOM.
export function redraw(dom) {
  return new Promise((resolve) => dom.window.requestAnimationFrame(resolve))
}

// Mirrors typing/selecting a value, then leaving the field - support.js and builder.js bind their
// state changes to `oninput`.
export function setValue(el, value) {
  el.value = value
  el.dispatchEvent(new el.ownerDocument.defaultView.Event('input', { bubbles: true }))
}

// A native .click() (rather than dispatching a synthetic click Event) so checkboxes get the
// browser's own toggle-then-fire-click activation behavior, matching a real user click.
export function click(el) {
  el.click()
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
