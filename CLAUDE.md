# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Tools for managing games of *Mobile Frame Zero: Intercept Orbit* (tabletop mech/spaceship game). A static
site with no build step, deployed via GitHub Pages at https://dogrizz.github.io/mf0/. There is no
`package.json`, bundler, test suite, or linter — plain HTML/JS files loaded directly via `<script>` tags.

The GitHub Pages + no-backend design is intentional: it avoids running or paying for any infrastructure.
All state (fleets, in-progress battles) lives in the browser's `localStorage`, giving each device its own
persistence with no server, account system, or sync. Keep this constraint in mind when changing
persistence or adding features — anything requiring a server, database, or cross-device sync is out of
scope unless the user explicitly decides to take on that infrastructure.

Rules reference: https://glyphpress.com/talk/mobile-frame-zero-002-intercept-orbit-final-pdf and
http://mobileframezero.com/mfz/

## Development

- No build/install step. Edit the files and open the relevant `.html` file directly in a browser (or serve
  the directory with any static file server, e.g. `python3 -m http.server`).
- No test suite exists.
- Formatting follows `.prettierrc` (no semicolons, single quotes, trailing commas, 2-space indent, 140 print
  width): `npx prettier --write .` — note `.prettierignore` excludes `*.html` and `*.min.js`.
- Third-party deps are loaded from CDN in each HTML file (Vue 3, Bootstrap 5.3.3) except
  `lz-string.min.js`, which is vendored locally.

## Architecture

Three independent pages, each an IIFE-wrapped [Vue 3](https://vuejs.org) (Composition API, explicit
`setup()`, no build step — components are loaded at runtime as separate template + logic files) app
mounted straight to `document.body` (no router, no shared app shell). Every page loads only the
`support/*.js` files it actually needs (see below) → the shared components
(`shared/vue-options-link.js`, `shared/vue-app-footer.js`) → the page's own components → `<page>.js`.

- **`index.html` / `builder.js`** — Fleet builder & PPA (points-per-asset) calculator. Lets players build
  fleets (ships with systems, mech companies via catapults) and computes PPA/total score. State persists to
  `localStorage['mf0-tools']` as plain JSON. "Fight!" hands the fleet roster to `storeBattle()` and
  navigates to `battle.html?battleId=<id>`. Loads `support/common.js`, `support/storage.js`,
  `support/builder.js`.
- **`battle.html` / `battle.js`** — Live battle tracker. Reads a battle by id from the `battleId` query
  param via `readBattle()`. Tracks per-system damage (checkbox disables a system), ship/company
  destruction, fuel state for mech companies, and ship capture/transfer between fleets mid-battle. A single
  `Vue.watch(() => state.battle, ..., { deep: true })` set up in `battle.js` calls `store(battle)` on any
  mutation, so individual components don't persist themselves. Loads `support/common.js`,
  `support/storage.js`, `support/battle.js`.
- **`battles.html` / `battles.js`** — Lists saved battles from `localStorage['mf0-battles']` with
  resume/forfeit (delete) actions. Loads `support/common.js`, `support/storage.js`.
- **`shared/`** — Vue components used by all three pages: `vue-options-link.js` (nav link to saved
  battles) and `vue-app-footer.js` (support links), each with a sibling `.template.html`.
- **`support/`** — The domain model and all business logic, split by domain (see
  `docs/adr/0001-split-support-js-by-domain.md`) so each page loads only what it needs:
  - `common.js` — constants shared across domains (`ShipSystem`, `AttackType`, `ShipType`, `MechSystem`,
    `MAX_SYSTEMS`) plus a private dice-scoring helper shared by the builder/battle `dice()` variants below.
  - `storage.js` — generic, domain-blind `localStorage`/`LZString` CRUD for saved battles: `store`,
    `storeBattle`, `readBattles`, `forfeitBattle`, `hash`. Never references a ship/company-shaped concept;
    battles are stored as `{ [id]: { data, date } }`, where `data` is the roster/track/sync state
    JSON-stringified and compressed with `LZString`. The id is either a djb2-style `hash()` of the data or
    an explicit id passed through (used when re-saving an existing battle).
  - `builder.js` — builder-only mutators (`setShipClass`, `setSystemClass`, `removeShip`, `duplicateShip`,
    `addShip`, etc.), `calculatePPA(players, syncShips)` (compares TAs and system counts across the roster,
    ±1 PPA at the extremes), and `builderDice(ship)` — the fleet builder's dice notation, which always
    shows a `2W` baseline since builder-shaped ships never track individual internal systems.
  - `battle.js` — battle-only mutators (`applySystemDamage`, `toggleCompanyFuel`, `transferShip`,
    `changePlayerHva`/`changePlayerTas`) and `attachComputedTotalAndRole(roster)`, which attaches `total`/
    `role` (Defender / Primary attacker / Secondary attacker) as Vue `computed` properties once per player
    — called from `battle.js`'s page entry right after the roster is inside Vue's reactive tree, not from
    inside `readBattle` (see `.scratch/support-domain-split/issues/02-spike-computed-total-and-role.md` for
    why). Also has `companyDice(company)` and `battleDice(ship)` (dice notation that counts real
    non-disabled internal systems), and owns `readBattle`, which calls
    `storage.js` for the raw read/write and lazily migrates old saved data on first read (backfilling ship
    `internal` systems and mech `companies` — see CONTEXT.md's "Builder-shaped"/"Battle-shaped ship").
  - `builder.js` and `battle.js` never call each other; anything both need lives in `common.js`.

### Data model

- **Player/fleet**: `name`, `hva`, `tas`, `systems`, `ppa`, `total`, `role`, `ships[]`, `companies[]`.
- **Ship**: `name`, `class` (`capital`/`frigate`), `systems[]` (each `{ class, disabled, attackType,
  attackType2 }` where class is `internal`/`attack`/`defense`/`sensor`/`catapult`), `destroyed`, `owner`
  (fleet id — used for capture tracking after a transfer in battle mode), `hasAce`/`aceType`.
- **Company** (mech, deployed from a ship's catapult system): `origin` (ship name), `systems[]` (class
  `system`/`weapon`/`defense`/`comm`/`movement`), `destroyed`, `outOfFuel`, `aceType`.

Each Vue component (in `builder/components/`, `battle/components/`, etc.) calls a mutation function from
the relevant `support/*.js` file (e.g. `removeShip`, `applySystemDamage`, `forfeitBattle`) from its
`setup()`. The fleet builder then calls `saveState()` itself; the battle tracker relies on `battle.js`'s
single deep `watch` to call `store(battle)` on any mutation, rather than each component persisting
itself. Mutation/persistence logic lives in `support/`, not the components, and there is no separate state
management layer.

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.
When picking up a task make sure to do it on a fresh worktree based off refreshed main to be sure we won't introduce unnecessary conflicts. Finish up implementation with a PR.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
