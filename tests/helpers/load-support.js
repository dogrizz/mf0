import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')

const EXPORTED_NAMES = [
  'ShipSystem',
  'AttackType',
  'ShipType',
  'MechSystem',
  'MAX_SYSTEMS',
  'calculatePPA',
  'dice',
  'companyDice',
  'recalculate',
  'determineRole',
  'storeBattle',
  'readBattle',
  'readBattles',
  'store',
  'hash',
]

// support.js and lz-string.min.js are plain classic scripts (no module system) loaded via
// <script> tags in the browser. We load them the same way here, via indirect eval so their
// top-level `const`/`function` declarations land in the real global scope, then read the
// pieces the tests need off a global stash. This exercises the exact files the pages ship,
// with no test-only fork of the source.
export function loadSupport() {
  const lzStringSource = readFileSync(path.join(repoRoot, 'lz-string.min.js'), 'utf-8')
  const supportSource = readFileSync(path.join(repoRoot, 'support.js'), 'utf-8')
  const stashStatement = `globalThis.__loadedSupport = { ${EXPORTED_NAMES.join(', ')} }`

  // eslint-disable-next-line no-eval
  ;(0, eval)(`${lzStringSource}\n${supportSource}\n${stashStatement}`)

  const loaded = globalThis.__loadedSupport
  delete globalThis.__loadedSupport
  return loaded
}
