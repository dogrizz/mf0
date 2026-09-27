import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export function readSource(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8')
}

function inlineScript(source) {
  // Closing-script-tag sequences can't appear inside an inline <script> body. Nor can a literal
  // "<!--": the HTML tokenizer treats that as entering "script data escaped state" (the legacy
  // <script><!-- ... --></script> hide-from-old-browsers trick), under which a later
  // </script> only counts if it's balanced against every <script>-like substring seen since -
  // otherwise it's swallowed as more script data, right through this and every following inline
  // script tag. Vue's dev build trips this via a warning string containing "<!--" verbatim.
  return `<script>${source.replace(/<\/script>/gi, '<\\/script>').replace(/<!--/g, '<\\!--')}</script>`
}

// A synchronous XMLHttpRequest that reads its "response" straight off disk instead of doing any
// real networking, rooted at `root`. Used in place of jsdom's real XMLHttpRequest so that Vue
// components on the fleet builder page can load their sibling `.template.html` file with a plain
// same-directory relative URL, synchronously, the same way they do via a real browser's
// synchronous XHR mode - without needing an actual HTTP server behind `http://localhost/` (which
// mountPage's `url` is kept as, since a `file://` document origin is "opaque" and jsdom refuses
// localStorage access for opaque origins, and this suite asserts on localStorage content).
class SyncFileXHR {
  open(method, url) {
    this._url = url
  }
  send() {
    this.responseText = fs.readFileSync(path.join(this.constructor.root, this._url), 'utf8')
    this.status = 200
    this.readyState = 4
  }
  setRequestHeader() {}
  getAllResponseHeaders() {
    return ''
  }
}

// Mounts a page from classic, non-module script sources inlined in document order (optionally
// preceded by a raw HTML snippet, e.g. to seed localStorage before the page's own scripts run),
// mirroring how each mf0 page loads its support/*.js files -> shared/page components -> <page>.js
// as real <script> tags sharing one global scope. Inlining (rather than running each source
// through window.eval) is required because jsdom only threads top-level `const`/`let` bindings -
// such as support/common.js's `ShipSystem`/`ShipType` - across scripts that are parsed and run
// together as part of the same document, matching how a browser shares one global lexical scope
// across <script> tags.
//
// `xhrRoot`, if given, installs SyncFileXHR (see above) as `window.XMLHttpRequest` before any
// inline script runs, so a script's first, synchronous top-level statement can already use it.
export function mountPage(scriptSources, { beforeScripts = '', url = 'http://localhost/', xhrRoot } = {}) {
  const html = `<!doctype html><html><body data-bs-theme="dark">${beforeScripts}${scriptSources.map(inlineScript).join('')}</body></html>`

  return new JSDOM(html, {
    url,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) {
      if (xhrRoot) {
        window.XMLHttpRequest = class extends SyncFileXHR {
          static root = xhrRoot
        }
        // jsdom doesn't implement window.fetch at all. Ticket 07's shared Vue components use
        // fetch() (rather than the synchronous XHR the rest of this page's components use - see
        // SyncFileXHR above) to load their template; this polyfill serves those same
        // same-directory template files straight off disk, the same way SyncFileXHR does.
        window.fetch = async (url) => {
          const text = fs.readFileSync(path.join(xhrRoot, new URL(url).pathname), 'utf8')
          return { text: async () => text }
        }
      }
    },
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
