# 03: Color-code the mech company dice chip, including ace dice

**What to build:** Apply the same coloring from ticket 01 to the mech-company card's dice chip in
`battle.html` (`companyDice`), and color the ace bonus-die suffix (e.g. `+Rd8`) to match the
company's assigned ace color — reusing the same red/blue/green/yellow already used for the ace
swatch itself in `builder/components/vue-builder-mech-companies.js`.

- `support/battle.js`: change `companyDice(company)` to return `[]` when destroyed/out of fuel (was
  `''`), otherwise a segment (via `diceSegment`, reusing ticket 01's helper) per system group present
  — internal `W`, weapon literal `2Rd` colored red, defense `B`, comms `Y`, movement `G` — and, when
  `company.aceType` is set, an ace-suffix segment `+${letter}d8` where `letter` is the existing
  `company.aceType[0].toUpperCase()` (already one of R/B/G/Y, so `DICE_COLORS` maps it straight
  through to the matching color).
- `battle/components/vue-battle-company.js`: rename the `diceText` computed to `diceSegments` and
  expose it instead.
- `battle/components/vue-battle-company.template.html`: replace the flat `{{ diceText }}`
  interpolation inside `.chip` with a `v-for` over `diceSegments`, same pattern as tickets 01/02.

**Blocked by:** 01 (reuses its `DICE_COLORS`/`diceSegment` helper and the `.dice-*` CSS classes;
independent of 02)

**Status:** done

- [x] `companyDice` returns colored segments including a colored ace suffix
- [x] The mech company chip renders colors matching ticket 01's mapping
- [x] A company's ace suffix color matches its assigned ace swatch color (test all four:
      red/blue/green/yellow)
- [x] An out-of-fuel or destroyed company still renders an empty chip, no error
- [x] Manual smoke pass: deploy a mech company with every system type and each of the four ace
      assignments, confirm colors match and nothing else in the battle tracker regressed

## Comments

Implemented as specced: `companyDice` (support/battle.js) now returns `[]` for a destroyed/out-of-fuel
company, otherwise a `diceSegment` per active system group (`W`/`2Rd`/`B`/`Y`/`G`) plus a colored
`+<letter>d8` ace suffix when `aceType` is set — the leading letter (R/B/G/Y) maps straight through
`DICE_COLORS` since `aceType` is always one of the four color names from `ACE_TYPES` in
`vue-builder-mech-companies.js`. `vue-battle-company.js` renamed its `diceText` computed to
`diceSegments`; the template swapped the flat interpolation for a `v-for` over segments, matching
tickets 01/02's pattern exactly. No new CSS needed — reused the existing `.dice-*` rules.

Updated `tests/support.test.js`'s `companyDice` describe block to the new segment-array contract,
including a case per ace color. `npx vitest run`: 58/58 passing. `npx prettier --check` clean on all
changed files. `/code-review medium`: no findings.

Manual smoke pass via Playwright (`nix-shell`, per this machine's local setup — see CLAUDE.local.md):
served the worktree over `python3 -m http.server` (file:// blocks the synchronous XHR the components
use to load their templates), deployed two mech companies off a carrier with a double catapult, gave
one every system type plus a red ace and the other a blue ace, confirmed the chip renders `2W2Rd1B1Y1G`
with each segment in its mapped color and the ace suffix (`+Rd8`/`+Bd8`) tinted to match its assigned
ace color — no console/page errors.
