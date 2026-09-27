import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// support/{common,storage,builder,battle}.js are classic scripts with no module exports, loaded
// via <script> tags on whichever pages need them and sharing the browser's global scope with
// lz-string.min.js. Indirect eval runs them the same way here, in the same dependency order every
// page loads them in (common -> storage -> builder/battle - see
// docs/adr/0001-split-support-js-by-domain.md), then this module hands back the pieces the tests
// need.
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// A separate eval() call per file won't do here: indirect eval's top-level `const`/`let`
// bindings (e.g. support/common.js's `ShipSystem`) don't carry over to a later eval() call in the
// same realm, only var/function declarations do. Concatenating into a single eval matches how a
// browser's <script> tags actually share one global lexical scope (see tests/helpers/page.js).
function loadClassicScripts(relativePaths) {
  const code = relativePaths.map((relativePath) => fs.readFileSync(path.join(rootDir, relativePath), 'utf-8')).join('\n')
  // eslint-disable-next-line no-eval
  ;(0, eval)(code)
}

loadClassicScripts(['lz-string.min.js', 'support/common.js', 'support/storage.js', 'support/builder.js', 'support/battle.js'])

export const calculatePPA = globalThis.calculatePPA
export const builderDice = globalThis.builderDice
export const battleDice = globalThis.battleDice
export const companyDice = globalThis.companyDice
export const store = globalThis.store
export const storeBattle = globalThis.storeBattle
export const readBattle = globalThis.readBattle
export const readBattles = globalThis.readBattles
