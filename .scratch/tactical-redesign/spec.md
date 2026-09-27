# Tactical redesign: apply the battle-tracker visual language to all three pages

Triage: ready-for-agent

## Problem Statement

All three pages (`index.html`/builder, `battle.html`, `battles.html`) currently share the same
generic look: default Bootstrap 5.3.3 dark theme, Sofia Sans from `fonts.cdnfonts.com`, and layout
built from fixed-width Bootstrap grid columns (`col-3`, `col-2`, `row-cols-2`, ...) rather than
anything that reflows by content. That breaks down at odd viewport widths (cards clipped or
overflowing on phones/tablets), gives no visual grouping when multiple fleets are on screen at
once, and communicates state (destroyed/captured/out-of-fuel, disabled systems) through subtle
color changes alone. None of it is responsive by design — it happens to work at whatever width the
Bootstrap column count was written for.

A design pass on `battle.html` (this feature's ticket 01) produced a distinct "tactical readout"
visual language — a mockup lives at https://claude.ai/artifact/UKBzrUQGGKZQPuFZnXPimd (private
Design-canvas artifact owned by dominik.zmitrowicz@gmail.com; four artboards: desktop/tablet/mobile
+ a mobile transfer-sheet state). The goal of this feature is to apply that same language to the
fleet builder and battles-list pages too, so all three pages read as one product instead of three
independently-styled tools.

## Design language (established by ticket 01, reused verbatim by tickets 02/03)

**Fonts** (Google Fonts `css2` links, replacing the `fonts.cdnfonts.com` Sofia Sans link):
- `Space Grotesk` (500/600/700) — headings, eyebrow labels, section titles
- `IBM Plex Sans` (400/500/600) — body text, form labels, buttons
- `IBM Plex Mono` (500/600) — numeric readouts: PPA/Total/HVA/TAs values, dice notation chips

**Colors** (dark theme, refined from the existing `--mf0-dark-bg`/rgb(26,29,32) base):
- Background `#12151a`, card surface `#1b2027`, elevated surface (inputs/chips) `#232a33`,
  border `#313a45`
- Text `#f2f4f6` primary, `#9aa7b3` secondary, `#6b7683` faint/eyebrow
- Status: destroyed/danger `#e0616f`, captured/warning/out-of-fuel `#e0b34f`, fuel-ok/success
  `#6fbf8b`
- Fleet identity: a small fixed accent palette assigned per fleet in roster order — amber
  `#f2a154`, cyan `#4fb0e0`, violet `#9c8cf0` — cycling if a battle/fleet-builder session has more
  fleets than colors (MFZ:IO doesn't cap player count, so this must degrade gracefully, not assume
  exactly 2-3 fleets)

**Reusable component patterns** (see the mockup for exact markup/spacing):
- **fleet-dot** — an 8-10px colored circle next to a fleet's name, the *only* place fleet-accent
  color appears as a shape (never a left-border strip on every card — that reads as a generic
  AI-generated template and was deliberately avoided in ticket 01)
- **stat-card** — a self-contained card per player/fleet in a scoreboard, replacing a shared
  label-column + one-grid-column-per-player layout that misaligns whenever it wraps. Editable
  fields (HVA/TAs/etc.) get a label-above-input layout; computed values (PPA/Total) render as
  monospace stat readouts; on narrow viewports the scoreboard becomes a horizontally
  scroll-snapping row instead of squeezing into unreadable widths
- **asset-card** — one ship or mech company, in a CSS grid (`grid-template-columns:
  repeat(auto-fill, minmax(240px, 1fr))`) instead of a fixed Bootstrap column count, so it reflows
  cleanly at any width instead of a hardcoded breakpoint list
- **status badges** — explicit text badges ("Destroyed", "Captured · ex Fleet X", "Out of fuel")
  instead of relying on a subtle color/strikethrough alone to communicate state
- **chip** — a monospace pill for dice notation and other short computed readouts
- **system-row** — a full-width, ≥40px-tall toggle row (small class icon + label + checkbox) for
  each system, replacing bare `label.form-check-label` + tiny checkbox rows — easier to scan and to
  tap on a phone
- **icon-btn** — a ≥36px square icon button with a real label/`aria-label`, replacing bare emoji
  buttons (⇌, ⛽, 📋) that have unclear meaning and small touch targets
- **overlay pattern** — a centered dialog on wide viewports, a full-width bottom sheet (drag handle,
  large tap targets) on narrow ones, for any modal-like interaction (ticket 01's ship-transfer
  popup; likely reusable wherever tickets 02/03 need a confirm/picker overlay)

## Constraints (from CLAUDE.md, carried over unchanged)

- No bundler, no build step — every page stays classic `<script>` tags, no ES modules.
- Bootstrap 5.3.3 and its JS bundle can be dropped from a page's `<head>` once that page's markup
  no longer depends on Bootstrap grid/utility/component classes — decide per page ticket rather
  than ripping it out repo-wide in one pass, since a half-migrated page mixing both systems is
  worse than one page still on Bootstrap for another ticket or two.
- `localStorage`-only persistence, no server — out of scope for this feature entirely.
- `.prettierignore` excludes `*.html`, so `*.template.html` files aren't subject to the repo's
  Prettier formatting; the `.js` component/logic files are.

## Testing decisions (applies to every ticket in this feature)

- `tests/helpers/load-battle-page.js`, `tests/helpers/load-builder-page.js`, and
  `tests/helpers/load-battles-page.js` all query the rendered DOM using today's Bootstrap-shaped
  classes (e.g. `.bg-dark-subtle`, `.btn-outline-info`, `.btn-outline-warning`,
  `label.form-check-label input[type="checkbox"]`, `.row.gap-3.border`). These are
  characterization-test helpers, not a public contract — each page ticket is expected to update its
  helper's selectors to match the new markup, but must **not** change what a test asserts about
  behavior (a checkbox still toggles the same disabled/destroyed/fuel state, a button still fires
  the same mutation). `npx vitest run` must pass after every ticket, and the fixture-driving test
  *bodies* in `tests/*.test.js` should need no changes — only the query helpers in
  `tests/helpers/load-*-page.js` are expected to change.
- Prefer semantic/structural selectors the new markup makes natural (a `data-*` hook, a stable
  class name used nowhere else) over matching on visible text or exact Bootstrap utility classes,
  so the next redesign pass doesn't re-break the same helpers.

## Tickets

1. **Battle tracker** (`battle.html`/`battle.js` + `battle/`) — done first, is the reference
   implementation every other ticket matches pixel-for-pixel on shared patterns.
2. **Fleet builder** (`index.html`/`builder.js` + `builder/`) — the largest page; see its own
   ticket for builder-specific patterns (system-slot dropdowns, ace picker, accordion) that don't
   exist on the battle page and need new treatment, not a direct copy.
3. **Battles list** (`battles.html`/`battles.js` + `battles/`) — smallest page, mostly a direct
   application of stat-card-adjacent list rows plus the shared nav/footer restyle.

## Out of Scope

- Any change to game rules, scoring math, or the localStorage schema/compressed battle format.
- Introducing a design system, bundler, or CSS framework beyond what's already loaded.
- Reworking `support.js`/`support/*.js` domain logic — this feature is presentation-only.

## Further Notes

- Ticket 01 is picked up immediately following this spec, in its own fresh worktree per
  `docs/agents/issue-tracker.md`. Tickets 02/03 are left `ready` for later pickup — each is
  independent of the others (no ordering dependency beyond "01 exists as the reference"), so either
  can be picked up next.
- Until all three tickets land, the site will look inconsistent (one or two pages restyled, others
  still on Sofia Sans/default Bootstrap) — that's an accepted, temporary state, not a regression to
  fix within a single ticket.
