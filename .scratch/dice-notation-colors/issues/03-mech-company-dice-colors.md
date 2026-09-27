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

**Status:** ready-for-agent

- [ ] `companyDice` returns colored segments including a colored ace suffix
- [ ] The mech company chip renders colors matching ticket 01's mapping
- [ ] A company's ace suffix color matches its assigned ace swatch color (test all four:
      red/blue/green/yellow)
- [ ] An out-of-fuel or destroyed company still renders an empty chip, no error
- [ ] Manual smoke pass: deploy a mech company with every system type and each of the four ace
      assignments, confirm colors match and nothing else in the battle tracker regressed

## Comments
