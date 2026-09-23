const fs = require('fs')
const path = require('path')
const { JSDOM, VirtualConsole } = require('jsdom')

const REPO_ROOT = path.resolve(__dirname, '..', '..')

// Loads a real page from the repo (not a synthetic snippet), inlining local
// <script src="..."> files with their actual contents (indirect eval() does
// NOT persist top-level const/let the way a real <script> tag does, so this
// must be string substitution before parsing, not window.eval() after the
// fact) and stripping remote <link>/<script> tags jsdom can't fetch
// (bootstrap, google fonts, the Alpine CDN link itself - we inject the real
// local alpinejs package instead, appended last to preserve load order).
function loadPage(htmlFilename, { seedLocalStorage } = {}) {
  let html = fs.readFileSync(path.join(REPO_ROOT, htmlFilename), 'utf8')

  if (seedLocalStorage) {
    const seedScript = `<script>${Object.entries(seedLocalStorage)
      .map(([key, value]) => `localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});`)
      .join('')}</script>`
    html = html.replace(/<body[^>]*>/, (openTag) => `${openTag}${seedScript}`)
  }

  html = html.replace(/<link[^>]+href="https:\/\/[^"]*"[^>]*>/g, '')

  const alpineSrc = fs.readFileSync(require.resolve('alpinejs/dist/cdn.min.js'), 'utf8')

  html = html.replace(/<script[^>]+src="(https:\/\/[^"]*)"[^>]*><\/script>/g, (match, src) => {
    if (src.includes('alpinejs')) return `<script>${alpineSrc}</script>`
    return ''
  })

  html = html.replace(/<script([^>]*)\ssrc="([^"]+)"([^>]*)><\/script>/g, (match, before, src, after) => {
    if (/^https?:\/\//.test(src)) return match
    const content = fs.readFileSync(path.join(REPO_ROOT, src), 'utf8')
    return `<script>${content}</script>`
  })

  const virtualConsole = new VirtualConsole()
  virtualConsole.sendTo(console, { omitJSDOMErrors: true })

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'http://localhost/',
    virtualConsole,
  })

  return dom
}

function settle(ms = 50) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function fireEvent(el, type) {
  el.dispatchEvent(new el.ownerDocument.defaultView.Event(type, { bubbles: true }))
}

function setValue(el, value) {
  el.value = value
  fireEvent(el, 'input')
}

module.exports = { loadPage, settle, fireEvent, setValue, REPO_ROOT }
