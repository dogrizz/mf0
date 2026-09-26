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
const BATTLE_SOURCE = read('battle.js')

function inlineScript(source) {
  // Closing-script-tag sequences can't appear inside an inline <script> body.
  return `<script>${source.replace(/<\/script>/gi, '<\\/script>')}</script>`
}

// Loads the battle tracker page exactly the way battle.html does (support.js -> common.js ->
// battle.js as classic, non-module scripts sharing one global scope), with Mithril read from the
// locally vendored dev dependency instead of the CDN <script> tag battle.html uses in production.
//
// A battle is handed to battle.html the same way the fleet builder hands one off in real use: by
// calling storeBattle() (and thus populating localStorage['mf0-battles']) before battle.js's own
// `oninit` reads `battleId` from the URL and calls readBattle(). Since a fresh JSDOM's localStorage
// can't be pre-seeded from outside (it's created empty, and each JSDOM instance has its own,
// unshared storage), an inline seed script that calls the real storeBattle() is spliced in between
// support.js and battle.js, using an explicit id so the URL's `battleId` query param can be fixed
// ahead of time. This exercises the exact same storeBattle -> readBattle (with its lazy migration)
// path a real fleet handoff would.
export function mountBattlePage({ roster, battleId = 1, track = true, sync = true }) {
  const seedScript = inlineScript(`storeBattle(${JSON.stringify(roster)}, ${track}, ${sync}, ${battleId})`)
  const html = `<!doctype html><html><body data-bs-theme="dark">${inlineScript(MITHRIL_SOURCE)}${inlineScript(LZ_STRING_SOURCE)}${inlineScript(SUPPORT_SOURCE)}${inlineScript(COMMON_SOURCE)}${seedScript}${inlineScript(BATTLE_SOURCE)}</body></html>`

  return new JSDOM(html, {
    url: `http://localhost/battle.html?battleId=${battleId}`,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
  })
}

// Mithril batches DOM updates from event handlers into the next animation frame, so tests must
// wait a frame after dispatching an event before asserting on the re-rendered DOM.
export function redraw(dom) {
  return new Promise((resolve) => dom.window.requestAnimationFrame(resolve))
}

export function click(el) {
  el.click()
}

// The persisted, decompressed battle for a given id - the same shape readBattle() hands back -
// read straight from localStorage['mf0-battles'] rather than from Mithril/JS internals.
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
