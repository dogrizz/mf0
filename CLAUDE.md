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
- Third-party deps are loaded from CDN in each HTML file (Mithril 2.2.2, Bootstrap 5.3.3) except
  `lz-string.min.js`, which is vendored locally.

## Architecture

Three independent pages, each an IIFE-wrapped [Mithril](https://mithril.js.org) app mounted straight to
`document.body` (no router, no shared app shell). Every page loads the same script sequence:
`support.js` → `common.js` → `<page>.js`.

- **`index.html` / `builder.js`** — Fleet builder & PPA (points-per-asset) calculator. Lets players build
  fleets (ships with systems, mech companies via catapults) and computes PPA/total score. State persists to
  `localStorage['mf0-tools']` as plain JSON. "Fight!" hands the fleet roster to `storeBattle()` and
  navigates to `battle.html?battleId=<id>`.
- **`battle.html` / `battle.js`** — Live battle tracker. Reads a battle by id from the `battleId` query
  param via `readBattle()`. Tracks per-system damage (checkbox disables a system), ship/company
  destruction, fuel state for mech companies, and ship capture/transfer between fleets mid-battle. Every
  mutation calls `store(battle)` to persist immediately.
- **`battles.html` / `battles.js`** — Lists saved battles from `localStorage['mf0-battles']` with
  resume/forfeit (delete) actions.
- **`common.js`** — Shared Mithril components used by all three pages: `OptionsComponent` (nav link to
  saved battles) and `FooterComponent` (support links).
- **`support.js`** — The domain model and all business logic, shared by every page:
  - Constants: `ShipSystem`, `AttackType`, `ShipType`, `MechSystem`, `MAX_SYSTEMS`.
  - `calculatePPA(players, syncShips)` — computes each player's PPA by comparing TAs (transportable
    assets) and system counts across the roster (extremes get ±1 PPA).
  - `dice(ship)` / `companyDice(company)` — derive the dice-roll notation (e.g. `2W1G1Rp2`) for a ship or
    mech company from its active (non-disabled) systems.
  - `recalculate(player, players)` / `determineRole(players)` — compute `total` score and assign roles
    (Defender / Primary attacker / Secondary attacker) based on relative `total`.
  - Battle persistence: `storeBattle`/`readBattle`/`readBattles`/`store` — battles are stored in
    `localStorage['mf0-battles']` as `{ [id]: { data, date } }`, where `data` is the roster/track/sync
    state JSON-stringified and compressed with `LZString`. The id is either a djb2-style `hash()` of the
    data or an explicit id passed through (used when re-saving an existing battle). `readBattle` also
    lazily migrates old saved data (e.g. backfilling ship `internal` systems and mech `companies`) on read.

### Data model

- **Player/fleet**: `name`, `hva`, `tas`, `systems`, `ppa`, `total`, `role`, `ships[]`, `companies[]`.
- **Ship**: `name`, `class` (`capital`/`frigate`), `systems[]` (each `{ class, disabled, attackType,
  attackType2 }` where class is `internal`/`attack`/`defense`/`sensor`/`catapult`), `destroyed`, `owner`
  (fleet id — used for capture tracking after a transfer in battle mode), `hasAce`/`aceType`.
- **Company** (mech, deployed from a ship's catapult system): `origin` (ship name), `systems[]` (class
  `system`/`weapon`/`defense`/`comm`/`movement`), `destroyed`, `outOfFuel`, `aceType`.

Each Mithril component factory (`SystemComponent`, `ShipComponent`, `FleetComponent`, etc.) in `builder.js`
and `battle.js` mutates plain JS objects/arrays directly in Mithril's `oninput`/`onclick` handlers, then
calls `saveState()` (builder) or `store(battle)` (battle tracker) to persist — there is no separate state
management layer.

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
