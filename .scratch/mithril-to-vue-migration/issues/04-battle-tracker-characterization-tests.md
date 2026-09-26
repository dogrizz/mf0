# 04: Battle tracker characterization tests

**What to build:** A DOM-level interaction test suite for the battle tracker page (`battle.html` /
`battle.js`), driving it as a player would and asserting on resulting DOM and
`localStorage['mf0-battles']`. Written against the *current* Mithril implementation as the regression net
for that page's later Vue rewrite.

**Blocked by:** 01 (Add dev-only test tooling)

**Status:** resolved

- [x] Covers per-system damage: a checkbox toggle disabling a system
- [x] Covers ship/company destruction marking
- [x] Covers mech company fuel state toggling
- [x] Covers ship capture/transfer between fleets mid-battle, including owner reassignment
- [x] Asserts on `localStorage['mf0-battles']` contents (decompressed) after interactions, not on
      Mithril-specific internals
- [x] Suite passes against the current, unmodified Mithril implementation

## Comments

Implemented `tests/battle.test.js` (6 tests) plus `tests/helpers/load-battle-page.js`, mirroring ticket
03's `load-builder-page.js` pattern: mithril/lz-string/support.js/common.js/battle.js are inlined as real
`<script>` tags into one jsdom document (offline, via the `mithril` dev dependency rather than the CDN
`index.html`/`battle.html` use in production).

One addition over the ticket-03 pattern: a battle can't be constructed directly in the DOM the way a fleet
roster can - it has to already exist in `localStorage['mf0-battles']` before `battle.js`'s `oninit` reads
`battleId` from the URL. Since a fresh `JSDOM` instance's `localStorage` starts empty and can't be
pre-seeded from outside (each instance's storage is separate and unshared), the helper splices in an
inline seed script - between `support.js` and `battle.js` - that calls the real `storeBattle()` with a
fixture roster and an explicit id, so the URL's `battleId` query param can be fixed ahead of time. This
exercises the same `storeBattle` → `readBattle` (with its lazy migration) handoff path a real fleet
builder → battle tracker navigation would.

The suite discovered that `battle.js` rebuilds every ship/company/fleet's Mithril component fresh on each
redraw (`fleet.ships.map((ship) => m(ShipComponent(), ...))` calls the factory anew every render, same
pattern as `builder.js`), which replaces their DOM subtrees rather than patching in place. Handlers bound
to a now-detached element still fire correctly and mutate the right underlying model objects (confirmed by
asserting on `localStorage` after clicking a captured-but-since-replaced checkbox), but DOM-level
assertions and further clicks need the *current*, live element - so each test re-queries fleet/ship/company
elements fresh from `document` after every redraw rather than reusing a captured reference across one, the
same way a real user interacting with the live page would.

The transfer test also characterizes that `transfer()` never reassigns a moved ship's `owner` field - only
which fleet's `ships` array contains it. This is a game-rules requirement, not just a display artifact
(per the user, correcting an earlier framing of this as merely feeding the "captured" indicator): the
original owner retains control over a captured ship's system (white) dice under the MFZ:IO rules, so the
app must keep tracking who that original owner was even after the ship changes fleets. The "captured"
class on the ship's title (`ship.owner !== fleet.id`) is the visual surfacing of that same fact, not the
reason the field is preserved.

All 47 tests pass (6 new + the existing 41) via `npm test`; `npx prettier --check tests/` is clean.
