# 04: Battle tracker characterization tests

**What to build:** A DOM-level interaction test suite for the battle tracker page (`battle.html` /
`battle.js`), driving it as a player would and asserting on resulting DOM and
`localStorage['mf0-battles']`. Written against the *current* Mithril implementation as the regression net
for that page's later Vue rewrite.

**Blocked by:** 01 (Add dev-only test tooling)

**Status:** ready-for-agent

- [ ] Covers per-system damage: a checkbox toggle disabling a system
- [ ] Covers ship/company destruction marking
- [ ] Covers mech company fuel state toggling
- [ ] Covers ship capture/transfer between fleets mid-battle, including owner reassignment
- [ ] Asserts on `localStorage['mf0-battles']` contents (decompressed) after interactions, not on
      Mithril-specific internals
- [ ] Suite passes against the current, unmodified Mithril implementation
