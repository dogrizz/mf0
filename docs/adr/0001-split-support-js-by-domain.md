# Split support.js by domain, not by kind

`support.js` grew to 515 lines mixing three pages' mutation logic, shared calculation helpers,
and battle persistence in one file, with a couple of functions (`dice`, `readBattle`'s migration)
silently branching on which page's data shape they'd been handed. We're splitting it into
`support/common.js` (shared constants + cross-domain helpers), `support/storage.js` (generic,
domain-blind localStorage/LZString CRUD), `support/builder.js`, and `support/battle.js` — one file
per page-domain plus the generic parts, loaded via `<script>` tags same as today (no bundler).

Rules that follow from this split, and why they're worth writing down:

- **`storage.js` stays domain-blind.** It never references `ShipSystem`/`MechSystem` or any
  battle-shaped concept. `readBattle`'s migration logic (backfilling internal systems and mech
  companies — see "Builder-shaped"/"Battle-shaped ship" in `CONTEXT.md`) is battle-domain
  knowledge, so it lives in `support/battle.js`, which calls `storage.js` only for the raw
  read/write. A future maintainer who goes looking for `readBattle` in the "storage" file and finds
  it in `battle.js` instead should read this as deliberate, not misplaced.
- **`builder.js` and `battle.js` never call each other's functions.** Anything both domains need
  goes in `common.js` instead (e.g. the two now-separate `dice()` implementations share a private
  scoring helper there, rather than one shared `dice()` inferring its caller's context from
  whether the ship happens to have internal systems yet).
- **No placeholder `support/battles.js`.** The battles-list page has no domain logic today beyond
  two direct `storage.js` calls; an empty file for symmetry would be speculative. Add it when real
  battles-list-specific logic exists, not before.
