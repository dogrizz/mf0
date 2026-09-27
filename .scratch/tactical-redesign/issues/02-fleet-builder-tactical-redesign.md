# 02: Apply the tactical redesign to the fleet builder (`index.html`)

**What to build:** Re-skin `index.html`, `builder.js`, and every `builder/**/*.template.html` +
`builder/**/*.js` component to match ticket 01's visual language (fonts, palette, `stat-card`,
`asset-card`, `chip`, `icon-btn`, badge classes — reuse the shared classes ticket 01 adds to
`style.css` rather than re-defining them). This page is the largest and jankiest of the three today
and needs new treatment for patterns the battle page doesn't have — do not just copy battle
markup 1:1.

Current pain points specific to this page (from reading
`builder/components/vue-builder-{system,ship,fleet,player,mech-companies,ship-tracker}.js` and
their templates):

- **Scoreboard** (`builder/vue-builder-app.template.html`): same shared-label-column +
  one-Bootstrap-column-per-player layout as battle.html had — replace with `stat-card`s per ticket
  01's pattern, but note the builder scoreboard has *five* fields (HVA, TAs, Systems, PPA, Total),
  not three, and TAs/Systems both disable together when `state.sync` is on — the disabled-field
  treatment needs a visible reason (e.g. a small "synced from ship data" note), not just a greyed
  input with no explanation.
- **Ship cards** (`vue-builder-ship.template.html`): fixed `.ships-list.row-cols-2` (always 2
  columns regardless of viewport) → `asset-grid` like ticket 01's ships. The `📋` duplicate button
  and `×` remove button need real `icon-btn`s with labels, matching the transfer/fuel button
  treatment on the battle page.
- **System editor** (`vue-builder-system.template.html`): a system slot here is a *build-time*
  editor (class dropdown: empty/Attack/Defence/Sensors/Catapult, plus attack-type dropdown(s) and a
  `+`/`-` toggle for a second attack type on the same slot) — semantically different from the
  battle page's *damage toggle* checkboxes, so don't reuse `system-row`'s checkbox-toggle pattern
  here. Needs its own small "system slot" card/row pattern: still icon-per-class for visual
  consistency with the battle page, but built around selects, not a checkbox.
- **Mech company / ace picker** (`vue-builder-mech-companies.template.html`): currently a dense
  `row-cols-3` with a hidden-until-eligible checkbox + conditionally-hidden ace-type `<select>`.
  Needs a clearer "eligible for an ace" affordance once a ship has a catapult, and the ace-type
  picker should probably become a set of labeled color swatches (red/blue/green/yellow ace) rather
  than a bare `<select>`, matching the fleet-dot idea of showing color as a small shape, not text
  alone.
- **Accordion** (`builder/vue-builder-app.template.html`'s `#fleetBuildingAccordion`): decide
  whether Bootstrap's accordion component is worth keeping once Bootstrap CSS/JS may be dropped
  (ticket 01 leaves that decision page-by-page) — if dropped, needs an equivalent
  expand/collapse affordance that doesn't depend on `data-bs-toggle`.
- **Fight! CTA** (`btn-lg btn-outline-success`, disabled when `state.players.length === 0`): keep as
  a clearly primary action, restyled to match the new button language, not a bare Bootstrap outline
  button.

**Blocked by:** none (ticket 01 should land first so its `style.css` additions exist to reuse, but
this ticket can be scoped/started independently)

**Status:** ready

- [ ] `index.html` loads the same Google Fonts link as `battle.html`; same call on Bootstrap
      CDN tags as ticket 01 made, applied consistently
- [ ] Scoreboard uses `stat-card`s; the sync-disabled TAs/Systems fields visibly explain why
      they're disabled
- [ ] Ship grid reflows via `auto-fill minmax(...)` at any width from 390px to 1440px
- [ ] Duplicate/remove ship buttons are real `icon-btn`s with `aria-label`s, no bare emoji
- [ ] System-slot editor keeps its dropdown-based editing but adopts the shared icon/typography
      language; the second-attack-type `+`/`-` toggle gets a clearer affordance than a bare `+`/`-`
      button
- [ ] Ace picker shows ace-type as color, not text-only, once a ship has a catapult
- [ ] Fleet-builder accordion (or its replacement) still lets a player collapse/expand the builder
      independent of the scoreboard
- [ ] `tests/helpers/load-builder-page.js` selectors updated to match new markup; no change to what
      `tests/builder.test.js` asserts
- [ ] `npx vitest run` passes
- [ ] `npx prettier --check` passes on every changed `.js` file
- [ ] Manual smoke pass at 390px, 834px, and 1440px: add a player, add a ship, add/edit systems
      (including a second attack type), add a catapult + pick an ace, hit Fight! — confirm the
      handoff to `battle.html` is unaffected and PPA/total still match pre-change output

## Comments
