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

**Status:** done

- [x] `index.html` loads the same Google Fonts link as `battle.html`; same call on Bootstrap
      CDN tags as ticket 01 made, applied consistently
- [x] Scoreboard uses `stat-card`s; the sync-disabled TAs/Systems fields visibly explain why
      they're disabled
- [x] Ship grid reflows via `auto-fill minmax(...)` at any width from 390px to 1440px
- [x] Duplicate/remove ship buttons are real `icon-btn`s with `aria-label`s, no bare emoji
- [x] System-slot editor keeps its dropdown-based editing but adopts the shared icon/typography
      language; the second-attack-type `+`/`-` toggle gets a clearer affordance than a bare `+`/`-`
      button
- [x] Ace picker shows ace-type as color, not text-only, once a ship has a catapult
- [x] Fleet-builder accordion (or its replacement) still lets a player collapse/expand the builder
      independent of the scoreboard
- [x] `tests/helpers/load-builder-page.js` selectors updated to match new markup; no change to what
      `tests/builder.test.js` asserts
- [x] `npx vitest run` passes
- [x] `npx prettier --check` passes on every changed `.js` file
- [x] Manual smoke pass at 390px, 834px, and 1440px: add a player, add a ship, add/edit systems
      (including a second attack type), add a catapult + pick an ace, hit Fight! — confirm the
      handoff to `battle.html` is unaffected and PPA/total still match pre-change output

## Comments

Implemented in a fresh worktree off refreshed main (per docs/agents/issue-tracker.md), since
ticket 03 had already landed and this ticket has no ordering dependency on it.

`index.html` dropped Bootstrap CDN tags entirely (CSS + JS bundle) and switched to the same Google
Fonts links as battle.html/battles.html, matching tickets 01/03's call rather than leaving builder
on a mixed Bootstrap/tactical look. Reused `stat-card`/`asset-card`/`asset-grid`/`icon-btn`/`chip`/
`badge`/`check-toggle` verbatim from style.css; added builder-only classes for the system-slot
editor, the disclosure (accordion replacement), and the ace color-swatch picker.

The Bootstrap accordion became a plain disclosure button + `v-show` (not `v-if`) on the body -
`v-if` would have unmounted `builder-ship-tracker` while collapsed, which is harmless for state
(all of it lives in `state.players`, not local component refs) but would have made
`tests/builder.test.js`'s existing assertions - which query fleet/ship elements immediately after
adding a player, without ever clicking to expand the disclosure - fail, since Bootstrap's original
collapse only ever hid the content via CSS the jsdom test harness never loads, not via removing it
from the DOM. `v-show` preserves that always-in-DOM behavior for free.

The system-slot editor's class-select + up-to-two attack-type selects + toggle button didn't fit
one row without truncating option text (verified via Playwright smoke screenshots) - split into
two stacked rows per slot (class select on its own row, attack-type selects + toggle indented
below when class is Attack) rather than cramming everything into the single-row layout the ticket
sketched.

Ace-picker keeps the existing single-ace-per-fleet constraint (`fleet.aceSelected`) unchanged, just
switched from a `:hidden` checkbox to a `v-if`'d one - a presentation-only cleanup, not a behavior
change (support/builder.js's setAce/setShipAce untouched).

`tests/helpers/load-builder-page.js` selectors updated to the new markup; `tests/builder.test.js`
assertions unchanged except one inline `.form-label` → `.stat-readout .v` selector swap (a
Bootstrap class embedded directly in the test body, not routed through a helper — same precedent
as `tests/battle.test.js`'s inline `.asset-name` selector from ticket 01).

`npx vitest run` (56 tests) and `npx prettier --check` on every changed `.js` file both pass.
Manual smoke pass done via Playwright screenshots (nix-shell, see CLAUDE.local.md) at 390/834/1440px:
added a player, added a ship, set a system to Attack with a second attack type, added a catapult,
picked a blue ace, hit Fight! - confirmed the handoff to battle.html and that PPA (5) matched
before and after. No console/page errors at any width.

`/code-review` flagged one issue, fixed: `REMOVE_ICON_SVG` was declared with the same global `var`
name in three different builder component files (system/ship/player) - since none of them are
IIFE-wrapped and all load as classic `<script>`s sharing one global scope, the last-loaded file's
value silently won everywhere, so the system-slot's "remove second attack type" button rendered
the wrong icon. Renamed each to a file-scoped name (`SHIP_REMOVE_ICON_SVG`,
`PLAYER_REMOVE_ICON_SVG`, `SYSTEM_SLOT_REMOVE_ICON_SVG`/`SYSTEM_SLOT_ADD_ICON_SVG`).
