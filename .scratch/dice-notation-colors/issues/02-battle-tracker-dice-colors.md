# 02: Color-code the battle tracker's ship dice chip

**What to build:** Apply the same coloring from ticket 01 to the battle tracker's per-ship dice chip
in `battle.html`, so a ship's live dice notation during a battle is colored the same way the fleet
builder's is, including the internals (`W`) segment shrinking live as systems get disabled.

- `support/battle.js`: change `battleDice(ship)` to return `[]` when destroyed (was `''`), otherwise
  an internals segment (via `diceSegment`, if any non-disabled internal systems remain) followed by
  `shipSystemsDice(ship)`'s segments — reusing the `diceSegment` helper and `shipSystemsDice` from
  ticket 01.
- `battle/components/vue-battle-ship.js`: rename the `diceText` computed to `diceSegments` and
  expose it instead.
- `battle/components/vue-battle-ship.template.html`: replace the flat `{{ diceText }}`
  interpolation inside `.chip` with a `v-for` over `diceSegments`, same pattern as ticket 01's
  builder-ship template.

**Blocked by:** 01 (reuses its `DICE_COLORS`/`diceSegment` helper, `shipSystemsDice`'s new
segment-array return type, and the `.dice-*` CSS classes)

**Status:** done

- [x] `battleDice` returns colored segments instead of a flat string
- [x] The battle tracker's ship dice chip renders colors matching ticket 01's mapping
- [x] Disabling a system (checkbox) live-updates the colored segments (e.g. disabling the last
      internal system removes the `W` segment; disabling all sensors removes the `Y` segment)
- [x] A destroyed ship still renders an empty chip, no error
- [x] Manual smoke pass: build a fleet in the builder covering every system type, send it to
      `battle.html`, damage/disable systems one at a time, confirm the chip recolors correctly and
      nothing else in the battle tracker regressed

## Comments

Implemented as specced: `battleDice` (support/battle.js) now builds an internals segment via
`diceSegment` (when any non-disabled internal systems remain) concatenated with
`shipSystemsDice(ship)`'s segments, returning `[]` for a destroyed ship. `vue-battle-ship.js`
renamed its `diceText` computed to `diceSegments`; the template swapped the flat interpolation for
a `v-for` over segments, one `dice-<color>` span each, matching ticket 01's builder-ship pattern
exactly. No new CSS needed — reused ticket 01's `.dice-*` rules as-is.

Updated `tests/support.test.js`'s `battleDice` describe blocks to the new segment-array contract
(reusing the `seg()` helper ticket 01 introduced for `builderDice`'s tests). `npx vitest run`: 58/58
passing. `npx prettier --check` clean on all changed files. `/code-review medium`: no findings.

Manual smoke pass via Playwright (`nix-shell`, per this machine's local setup — see
CLAUDE.local.md): built a frigate with catapult/defense/sensor and a capital ship with a dual-type
attack system, sent the fleet to `battle.html`, confirmed the chip segments render with the correct
colors/tokens, disabling the catapult checkbox live-removed only the `1K` segment (rest untouched),
and disabling every remaining system destroyed the ship — chip rendered empty, `is-dead` class
present, no console/page errors.
