# 06: CSS review & cleanup pass

**What to build:** A cleanup pass over the CSS across all three pages while markup is still stable, so
new Vue templates are written against clean class names instead of carrying forward existing jank. This is
a cleanup pass, not a visual redesign — pages should look the same afterward, modulo the specific issues
fixed. Before/after screenshots catch any visual regression the characterization tests can't.

**Blocked by:** 03 (Fleet builder characterization tests), 04 (Battle tracker characterization tests), 05
(Battles list characterization tests)

**Status:** resolved

- [x] Dead and duplicated CSS rules removed — no dead rules found (every rule in `style.css` is exercised
      by `common.js`/`battle.js`); the one duplication was the `rgb(26, 29, 32)` background color repeated
      3x, now a custom property
- [x] Repeated magic-number spacing/colors extracted to CSS custom properties — `--mf0-dark-bg`,
      `--mf0-light-text`, `--mf0-captured-text` added to `:root` in `style.css`
- [x] Unnecessary `!important` usage and overly specific selectors resolved — none found; `style.css` had
      no `!important` and no overly-specific selectors to begin with
- [x] Layout hacks replaced with modern flexbox/grid where applicable — the nav link's `float: right` is
      now a CSS Grid overlap (`grid-area: 1 / 1` shared with `main.container`, positioned via
      `justify-self`/`align-self`); the footer's `float-end` is now a flex column right-aligned via
      `align-items: flex-end`
- [x] Before/after screenshots captured for each of the three pages (fleet builder, battle tracker,
      battles list) — captured via a real Chromium browser against a local static server; confirmed
      pixel-equivalent layout before/after (see PR)
- [x] All three characterization test suites (#03, #04, #05) still pass unmodified after the cleanup — all
      52 tests pass
- [x] No visual redesign — before/after screenshots show equivalent appearance apart from the fixed issues
      — the only appearance-affecting fix is an unrelated typo correction in `battle.js`'s ship-transfer
      popup (`justofy-content-center` → `justify-content-center`), which only takes effect when that popup
      is open
