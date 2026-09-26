import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export function readSource(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8')
}

function inlineScript(source) {
  // Closing-script-tag sequences can't appear inside an inline <script> body.
  return `<script>${source.replace(/<\/script>/gi, '<\\/script>')}</script>`
}

// Mounts a page from classic, non-module script sources inlined in document order (optionally
// preceded by a raw HTML snippet, e.g. to seed localStorage before the page's own scripts run),
// mirroring how each mf0 page loads support.js -> common.js -> <page>.js as real <script> tags
// sharing one global scope. Inlining (rather than running each source through window.eval) is
// required because jsdom only threads top-level `const`/`let` bindings - such as support.js's
// `ShipSystem`/`ShipType` - across scripts that are parsed and run together as part of the same
// document, matching how a browser shares one global lexical scope across <script> tags.
export function mountPage(scriptSources, { beforeScripts = '' } = {}) {
  const html = `<!doctype html><html><body data-bs-theme="dark">${beforeScripts}${scriptSources.map(inlineScript).join('')}</body></html>`

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

// A native .click() (rather than dispatching a synthetic click Event) so checkboxes get the
// browser's own toggle-then-fire-click activation behavior, matching a real user click.
export function click(el) {
  el.click()
}
