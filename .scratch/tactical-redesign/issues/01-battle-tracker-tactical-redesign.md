# 01: Apply the tactical redesign to the battle tracker (`battle.html`)

**What to build:** Re-skin `battle.html`, `battle.js`, and every `battle/**/*.template.html` +
`battle/**/*.js` component per the mockup at
https://claude.ai/artifact/UKBzrUQGGKZQPuFZnXPimd and the design language in
`../spec.md`. This is a presentation-only pass — no change to `support.js`/`support/battle.js`
mutation functions, the localStorage schema, or what any button/checkbox actually does.

Concretely:

- `battle.html`: replace the `fonts.cdnfonts.com` Sofia Sans `<link>` with the Google Fonts `css2`
  link for Space Grotesk / IBM Plex Sans / IBM Plex Mono (see spec.md). Decide whether Bootstrap's
  CSS/JS `<script>`/`<link>` tags can come out entirely once the new markup no longer needs them
  (check `style.css`'s `.accordion-button` rule isn't battle-page-specific dead weight either way).
- `style.css`: add the new design tokens (`:root` custom properties for the palette) and the shared
  component classes (`stat-card`, `asset-card`, `chip`, `system-row`, `icon-btn`, badges, `fleet-dot`)
  — scope class names so they're safe to reuse unchanged by tickets 02/03 rather than
  battle-page-private.
- `battle/vue-battle-app.template.html`: scoreboard becomes a row of `stat-card`s (was a shared
  label column + `battle-player` grid column per player); on narrow viewports it becomes a
  horizontally scroll-snapping row instead of wrapping.
- `battle/components/vue-battle-player.js`/`.template.html`: fields move to label-above-input;
  PPA/Total/Role render as mono stat readouts + a role badge instead of plain `form-label` spans.
- `battle/components/vue-battle-fleet.js`/`.template.html`: fleet header gets a `fleet-dot` +
  ship/company count meta line; ships+companies render in one responsive `asset-grid`
  (`repeat(auto-fill, minmax(240px, 1fr))`) instead of `col-3`.
- `battle/components/vue-battle-ship.js`/`.template.html`: destroyed/captured become explicit
  badges (not just a class swap); the `⇌` button becomes an `icon-btn` with a real
  `aria-label="Transfer ship"`; system checkboxes become `system-row`s (icon per `system.class` +
  full-row tap target ≥40px tall); the transfer popup becomes a centered dialog on wide viewports /
  full-width bottom sheet (drag handle, real close button) on narrow ones, replacing the current
  `.popup`/`.overlay` fixed-30%-width box in `style.css`.
- `battle/components/vue-battle-company.js`/`.template.html`: same `system-row` treatment; the `⛽`
  button becomes an `icon-btn` with a fuel-state badge ("Fueled"/"Out of fuel") next to it, not
  instead of it.
- `shared/vue-options-link.js`/`shared/vue-app-footer.js` + their templates: restyle the nav link
  and footer to match (small typography/spacing pass only — these are shared by all three pages, so
  keep changes additive/backward-compatible with however tickets 02/03 end up using them; don't
  rename their props or template hooks).

No behavior change from a player's perspective: every mutation function call site
(`applySystemDamage`, `transferShip`, `toggleCompanyFuel`, `changePlayerHva`, `changePlayerTas`)
stays wired exactly as it is today, only the surrounding markup/classes change.

**Blocked by:** none

**Status:** ready

- [ ] `battle.html` loads the new Google Fonts link; Bootstrap CDN tags kept or dropped with a
      one-line note in the PR explaining the call
- [ ] `style.css` carries the shared design tokens + component classes, written so tickets 02/03 can
      reuse them without duplication
- [ ] Scoreboard renders as `stat-card`s, scroll-snapping horizontally below the mobile breakpoint
- [ ] Ship/company grid uses `auto-fill minmax(240px, 1fr)` — verify by resizing from 390px to
      1440px that it reflows without any card being clipped or overflowing
- [ ] Destroyed/captured/out-of-fuel all show an explicit text badge, not just a color change
- [ ] Every icon-only button (`⇌`, `⛽`) has a real `aria-label` and is ≥36px square
- [ ] System toggle rows are ≥40px tall and show a small icon per `system.class`
      (internal/attack/defense/sensor/catapult for ships; system/weapon/defense/comm/movement for
      companies)
- [ ] Transfer popup is a centered dialog ≥480px wide viewports, a full-width bottom sheet on
      narrow ones — no more fixed `width: 30%`
- [ ] `tests/helpers/load-battle-page.js` selectors updated to match the new markup (see spec.md's
      Testing decisions) — no change to what `tests/battle.test.js` asserts
- [ ] `npx vitest run` passes
- [ ] `npx prettier --check` passes on every changed `.js` file
- [ ] Manual smoke pass at 390px, 834px, and 1440px widths: build a fleet, fight, damage a system,
      capture/transfer a ship, toggle a company's fuel — confirm state still persists across reload
      and nothing regressed from the current battle.html behavior

## Comments
