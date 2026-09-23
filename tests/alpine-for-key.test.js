const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const { JSDOM } = require('jsdom')

// Not app-specific - this documents a real Alpine.js contract we got bitten by
// once (see .ai/alpine-migration.md, "Bug #4"): x-for's :key must evaluate to
// a string or integer. Passing an object reference doesn't error loudly, it
// silently coerces every item's key to "[object Object]" and collides them
// all into one lookup slot. If a future edit (in this repo, anywhere) keys an
// x-for by an object instead of one of its primitive fields, this is the
// guardrail that should catch it before a user does.

const alpineSrc = fs.readFileSync(require.resolve('alpinejs/dist/cdn.min.js'), 'utf8')

function buildList(keyExpr) {
  const html = `<!DOCTYPE html><html><body x-data="{ items: [ {_key:'a', name:'A'}, {_key:'b', name:'B'}, {_key:'c', name:'C'} ] }">
  <template x-for="item in items" :key="${keyExpr}">
    <div class="row" x-text="item.name" @click="items.splice(items.indexOf(item), 1)"></div>
  </template>
  <button id="add" @click="items.push({_key: 'd', name: 'D'})">add</button>
  <script>${alpineSrc}</script>
  </body></html>`
  return new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/' })
}

function settle(ms = 50) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function click(el) {
  el.dispatchEvent(new el.ownerDocument.defaultView.Event('click', { bubbles: true }))
}

test('x-for :key as an object reference breaks removal + subsequent additions', async () => {
  // The collision doesn't show up on the initial render (Alpine still
  // creates one DOM node per item the first time) - it shows up once the
  // array is mutated and Alpine tries to diff against its (collided) key
  // lookup. This is the exact sequence that broke the builder page's
  // ship removal (see .ai/alpine-migration.md, Bug #4).
  const dom = buildList('item')
  await settle()

  const rowsBefore = dom.window.document.querySelectorAll('.row')
  assert.equal(rowsBefore.length, 3, 'sanity check: all three items render initially despite the colliding key')

  click(rowsBefore[1]) // remove "B"
  await settle()
  click(dom.window.document.getElementById('add')) // then try to add "D"
  await settle()

  const rowsAfter = Array.from(dom.window.document.querySelectorAll('.row')).map((r) => r.textContent)
  assert.notDeepEqual(rowsAfter, ['A', 'C', 'D'], 'expected the object-reference key to break remove-then-add (documents an Alpine limitation, not a bug in this repo)')
})

test('x-for :key as a primitive string renders one row per item', async () => {
  const dom = buildList('item._key')
  await settle()
  const rows = Array.from(dom.window.document.querySelectorAll('.row')).map((r) => r.textContent)
  assert.deepEqual(rows, ['A', 'B', 'C'])
})
