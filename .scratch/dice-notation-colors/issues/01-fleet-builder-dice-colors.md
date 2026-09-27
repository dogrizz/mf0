# 01: Color-code the fleet builder's dice chip

**What to build:** In the fleet builder (`index.html`), each ship's dice-notation chip (e.g.
`2W1G3KRp1`) renders each segment tinted by its die color instead of one flat color, per the mapping
in `../spec.md`: white/green/black(as muted gray)/blue/yellow/red, reusing the same `--tac-danger`
/`--tac-focus`/`--tac-success`/`--tac-warning` tokens the ace-swatch picker already uses for
red/blue/green/yellow, plus `--tac-text`/`--tac-text-secondary` for white/black.

This ticket also introduces the shared groundwork tickets 02 and 03 reuse:

- `support/common.js`: add a `DICE_COLORS` letter→color-name map and a `diceSegment(text,
  letterKey)` helper. Change `shipSystemsDice` to build and return an array of `{ text, color }`
  segments (same branching order as today: frigate `G` → catapult `K` → defense `B` → sensor `Y` →
  one `R<type><n>` segment per attack type present) instead of concatenating a string.
- `support/builder.js`: change `builderDice(ship)` to return `[]` when destroyed (was `''`),
  otherwise the `2W` segment followed by `shipSystemsDice(ship)`'s segments.
- `style.css`: add one rule per color right after the existing `.root .chip` block —
  `.root .chip .dice-white`, `.dice-black`, `.dice-green`, `.dice-red`, `.dice-blue`,
  `.dice-yellow` — each setting only `color` to the token from the mapping table.
- `builder/components/vue-builder-ship.js`: rename the `diceText` computed to `diceSegments`
  (now an array) and expose it instead.
- `builder/components/vue-builder-ship.template.html`: replace the flat `{{ diceText }}`
  interpolation inside `.chip` with a `v-for` over `diceSegments`, one inner `<span>` per segment
  classed `'dice-' + segment.color`.

**Blocked by:** none

**Status:** done

- [x] `shipSystemsDice`/`builderDice` return colored segments instead of a flat string
- [x] The fleet builder's ship dice chip visually colors each letter group per the mapping table in
      `../spec.md` (build a frigate with a catapult, a defense system, a sensor, and both a
      single-type and dual-type attack system to exercise every color)
- [x] A destroyed ship still renders an empty chip, no error
- [x] `style.css` has one rule per die color, scoped under `.chip`, with no new hex values
      introduced (only existing `--tac-*` tokens)
- [x] Manual smoke pass: open `index.html`, add ships covering every system type, confirm colors
      match and nothing else in the builder regressed

## Comments

Merged as PR #32. Introduced the shared groundwork tickets 02/03 reuse: `support/common.js` got a
`DICE_COLORS` letter→color-name map and a `diceSegment(text, letterKey)` helper, and
`shipSystemsDice`/`builderDice` now build arrays of `{ text, color }` segments instead of
concatenated strings. `vue-builder-ship.js`/`.template.html`'s `diceText` became `diceSegments`,
rendered as one `<span class="dice-<color>">` per segment inside `.chip`. `style.css` got one
`.root .chip .dice-<color>` rule per die color, all existing `--tac-*` tokens, no new hex values.
`support/battle.js`'s `battleDice` flattened the new segment array back into a string at the time,
since ticket 02 (since also merged) owned the battle tracker's own colored rendering.

`npx vitest run` (58/58), `npx prettier --check`, and `/code-review medium` all clean. Manual
Playwright smoke test against the live fleet builder (frigate with catapult/defense/sensor/attack
systems) confirmed chip segment colors matched the spec's mapping.
