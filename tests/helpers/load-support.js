import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// support.js is a classic script with no module exports, loaded via a `<script>` tag in every
// page and sharing the browser's global scope with lz-string.min.js. Indirect eval runs it the
// same way here, then this module hands back the pieces the tests need.
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function loadClassicScript(relativePath) {
  const code = fs.readFileSync(path.join(rootDir, relativePath), 'utf-8')
  // eslint-disable-next-line no-eval
  ;(0, eval)(code)
}

loadClassicScript('lz-string.min.js')
loadClassicScript('support.js')

export const calculatePPA = globalThis.calculatePPA
export const dice = globalThis.dice
export const companyDice = globalThis.companyDice
export const recalculate = globalThis.recalculate
export const determineRole = globalThis.determineRole
export const store = globalThis.store
export const storeBattle = globalThis.storeBattle
export const readBattle = globalThis.readBattle
export const readBattles = globalThis.readBattles
