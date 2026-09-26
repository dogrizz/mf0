# Split support.js by domain; revisit idiomatic Vue patterns post-migration

Triage: ready-for-agent

## Problem Statement

The Mithril→Vue migration is functionally complete, and `support.js` (515 lines) hasn't changed
shape since before it: constants, builder-only mutations, battle-only mutations, and
battle-persistence/migration logic all live in one file, called as bare globals from whichever
page's `<script>` tags happen to include it. Two concrete symptoms came out of a design-grill
session (see `docs/adr/0001-split-support-js-by-domain.md`):

1. `dice(ship)` silently branches on `hasInternals(ship)` to distinguish a builder-created ship
   (no internal systems yet, hardcoded `2W` fallback) from a battle-tracked ship (counts real
   surviving internal systems) — one function guessing which domain's data shape it received.
2. Every battle-mutating component (`vue-battle-player.js`, `vue-battle-company.js`,
   `vue-battle-ship.js`) calls `store(props.battle)` manually right after its own mutation — six
   near-identical call sites doing the same "persist the whole battle" step.

## Solution

Split `support.js` into `support/common.js`, `support/storage.js`, `support/builder.js`, and
`support/battle.js` along the domain boundaries in ADR-0001, fixing the two symptoms above as part
of the same pass (they're mechanical, behavior-preserving, and directly caused by the current
grouping). Land this as ticket 01. Separately, spike whether `total`/`role` should become Vue
`computed` properties instead of imperative `recalculate`/`determineRole` calls — land as ticket
02, after 01, since it's exploratory and touches what gets persisted.

## Implementation Decisions

- No bundler, no ES modules — same zero-build, classic-`<script>`-tag architecture as today. Each
  new file is a classic script defining globals, loaded in a fixed order per page.
- File layout: `support/common.js` (constants: `ShipSystem`, `AttackType`, `ShipType`,
  `MechSystem`, `MAX_SYSTEMS`; the private attack/defense/sensor/catapult scoring helper shared by
  both `dice()` variants), `support/storage.js` (domain-blind: `store`, `storeBattle`,
  `readBattles`, `forfeitBattle`, `hash`), `support/builder.js` (all builder-only mutators +
  `calculatePPA` + builder's `dice()`), `support/battle.js` (all battle-only mutators + battle's
  `dice()`/`companyDice` + `readBattle` and its migration helpers, which call into `storage.js` for
  the raw read).
- No `support/battles.js` — battles-list has no domain logic beyond two direct `storage.js` calls
  today (`readBattles`, `forfeitBattle`). Add it only when real battles-list-specific logic exists.
- Dependency direction (see ADR-0001): `storage.js` never depends upward on a domain file;
  `builder.js` and `battle.js` never call each other.
- `dice()` splits into two purpose-named functions (a builder-domain preview version, a
  battle-domain live version), sharing a private scoring helper in `common.js` for the
  attack/defense/sensor/catapult math that's identical either way.
- The six manual `store(props.battle)` calls move to a single `watch(() => state.battle, () =>
  store(state.battle), { deep: true })` set up once in `battle.js` (the page entry script, where
  `state` already lives).

## Testing Decisions

- The existing `tests/` suite (added during the Mithril→Vue migration) is the regression net:
  `tests/support.test.js`, `tests/battle.test.js`, `tests/builder.test.js`, `tests/battles.test.js`,
  and `tests/smoke.test.js` should all pass unmodified against the split, proving behavior is
  preserved.
- `tests/helpers/load-support.js` currently `eval`s a single `support.js` file into `globalThis`;
  it needs to load all four new files in dependency order (`common.js`, `storage.js`, then
  `builder.js`/`battle.js`) instead.
- Each page's `<script>` tag list (`index.html`, `battle.html`, `battles.html`) changes to load
  only the `support/*.js` files that page actually needs, instead of one `support.js` — this is
  itself a small verification that the domain boundaries are real (if a page needs a file "from
  the wrong domain," the boundary was drawn wrong).

## Out of Scope

- Introducing a bundler or ES modules — explicitly ruled out; see ADR-0001 and CLAUDE.md's
  no-build-step constraint.
- Any change to the `localStorage` schema/keys or the compressed battle data format.
- `total`/`role` as `computed` — deferred to ticket 02, gated on a spike, not decided here.
- Any change to game rules or scoring logic — this is a code-organization pass only.

## Further Notes

- Scoped through an interactive design-grill session. The `dice()` and persistence-call-site
  findings came from tracing actual call sites (not guessed), and are recorded in ADR-0001 /
  `CONTEXT.md` ("Internal system", "Builder-shaped"/"Battle-shaped ship").
- `builder.js`'s own `saveState()`/`recalculatePPA()` (the `mf0-tools` localStorage key) stay as
  page-level bootstrap code, not moved into a `support/builder.js` "service" — they're two lines,
  used in one place, and don't carry the compression/hashing/migration complexity that justified
  pulling battle persistence into `storage.js`. Forcing symmetry here would be premature
  abstraction.
