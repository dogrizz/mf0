# 06: CSS review & cleanup pass

**What to build:** A cleanup pass over the CSS across all three pages while markup is still stable, so
new Vue templates are written against clean class names instead of carrying forward existing jank. This is
a cleanup pass, not a visual redesign — pages should look the same afterward, modulo the specific issues
fixed. Before/after screenshots catch any visual regression the characterization tests can't.

**Blocked by:** 03 (Fleet builder characterization tests), 04 (Battle tracker characterization tests), 05
(Battles list characterization tests)

**Status:** ready-for-agent

- [ ] Dead and duplicated CSS rules removed
- [ ] Repeated magic-number spacing/colors extracted to CSS custom properties
- [ ] Unnecessary `!important` usage and overly specific selectors resolved
- [ ] Layout hacks replaced with modern flexbox/grid where applicable
- [ ] Before/after screenshots captured for each of the three pages (fleet builder, battle tracker,
      battles list)
- [ ] All three characterization test suites (#03, #04, #05) still pass unmodified after the cleanup
- [ ] No visual redesign — before/after screenshots show equivalent appearance apart from the fixed issues
