// A small in-memory, Map-backed localStorage polyfill for tests/support.test.js, which needs
// `localStorage` global to exercise support/storage.js's storeBattle/readBattle/store. Node 24 (this
// machine) has no stable in-memory localStorage - `--experimental-webstorage` is file-backed and
// still experimental (confirmed by direct testing) - so this stands in for it instead of pulling in
// jsdom (see .scratch/retire-jsdom-and-sync-xhr/spec.md) just for one global.
//
// support/battle.js's readBattle migration also reads `self.crypto.randomUUID()` - `self` is a
// browser/jsdom global with no Node equivalent, so it's aliased to `globalThis` here too, right
// next to the other browser-global shim this suite needs to run jsdom-free.
globalThis.self = globalThis

const store = new Map()

globalThis.localStorage = {
  getItem(key) {
    return store.has(key) ? store.get(key) : null
  },
  setItem(key, value) {
    store.set(key, String(value))
  },
  removeItem(key) {
    store.delete(key)
  },
  clear() {
    store.clear()
  },
  key(index) {
    return Array.from(store.keys())[index] ?? null
  },
  get length() {
    return store.size
  },
}
