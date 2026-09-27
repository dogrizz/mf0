# Color-code the dice notation chips

Triage: ready-for-agent

## Problem statement

The fleet builder, battle tracker, and mech-company cards each show a compact dice-notation string
(e.g. `2W1G3KRp1Ra1`) inside a `.chip` span, built by `builderDice`/`battleDice`/`companyDice` in
`support/builder.js`/`support/battle.js`. It renders as one flat, uncolored string today, so reading
which segment is which physical die color means mentally parsing the letters one at a time. The goal
is to tint each segment by its die color (W=white, G=green, K=black, B=blue, Y=yellow, R=red) so the
chip reads at a glance.

This is presentation-only — no change to the domain model, the dice-value math, or persisted state.

## Color mapping

`support/battle.js`'s existing `companyDice` ace-die suffix already encodes this exact convention —
`+${company.aceType[0].toUpperCase()}d8`, where `aceType` is `'red'|'blue'|'green'|'yellow'` and the
matching swatch colors are defined once in `builder/components/vue-builder-mech-companies.js`
(`ACE_TYPES`) as `--tac-danger` (red), `--tac-focus` (blue), `--tac-success` (green), `--tac-warning`
(yellow). Reusing those same four design tokens for the R/B/G/Y dice letters keeps the ace-die color
and the dice-notation color for the same letter identical — no new hex values needed for 4 of 6
colors.

For the remaining two:
- **W (white)** → `--tac-text` (`#f2f4f6`), the page's brightest text tone.
- **K (black)** → `--tac-text-secondary` (`#9aa7b3`), the existing muted/gray token. Pure black would
  vanish against the dark `.chip` background (`--tac-elevated`, `#232a33`); the muted gray reads as
  "the dark die" in contrast to the four vivid colors and W's bright white, while staying legible.

Final mapping (all via existing `--tac-*` tokens, zero new hex values):

| Letter | Color  | Token                    |
|--------|--------|--------------------------|
| W      | white  | `--tac-text`             |
| G      | green  | `--tac-success`          |
| K      | black  | `--tac-text-secondary`   |
| B      | blue   | `--tac-focus`            |
| Y      | yellow | `--tac-warning`          |
| R      | red    | `--tac-danger`           |

## Shared approach (introduced by ticket 01, reused by 02/03)

- `support/common.js` gets a `DICE_COLORS` letter→color-name map and a `diceSegment(text, letterKey)`
  helper (returns `{ text, color }`), next to the existing `shipSystemsDice` helper. `shipSystemsDice`
  itself changes to build and return an **array of segments** instead of concatenating a string, same
  branching/order as today.
- `builderDice`/`battleDice`/`companyDice` change from returning a flat string to returning an array
  of `{ text, color }` segments (`[]` in the destroyed/out-of-fuel case, matching today's `''`).
- Each of the three Vue components (`vue-builder-ship.js`, `vue-battle-ship.js`,
  `vue-battle-company.js`) renames its `diceText` computed to `diceSegments` and exposes the array
  instead of a string.
- Each matching template (`vue-builder-ship.template.html`, `vue-battle-ship.template.html`,
  `vue-battle-company.template.html`) replaces the flat `{{ diceText }}` interpolation inside
  `.chip` with a `v-for` over `diceSegments`, one inner `<span>` per segment classed
  `'dice-' + segment.color`.
- `style.css` gets one rule per color right after the existing `.root .chip` block:
  `.root .chip .dice-white`, `.dice-black`, `.dice-green`, `.dice-red`, `.dice-blue`,
  `.dice-yellow`, each setting only `color`.

No changes to `CONTEXT.md`/ADRs — the domain model and dice-value math are untouched.

## Testing decisions

No test suite/build step exists in this repo. Verify manually per ticket by serving the site
(`python3 -m http.server`) or opening the relevant `.html` file directly, and confirm colors match
the mapping table above plus that a destroyed/out-of-fuel asset still renders an empty chip (no
error).

## Comments
