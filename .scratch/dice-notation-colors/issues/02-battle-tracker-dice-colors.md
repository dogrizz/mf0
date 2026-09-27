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

**Status:** ready-for-agent

- [ ] `battleDice` returns colored segments instead of a flat string
- [ ] The battle tracker's ship dice chip renders colors matching ticket 01's mapping
- [ ] Disabling a system (checkbox) live-updates the colored segments (e.g. disabling the last
      internal system removes the `W` segment; disabling all sensors removes the `Y` segment)
- [ ] A destroyed ship still renders an empty chip, no error
- [ ] Manual smoke pass: build a fleet in the builder covering every system type, send it to
      `battle.html`, damage/disable systems one at a time, confirm the chip recolors correctly and
      nothing else in the battle tracker regressed

## Comments
