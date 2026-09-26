# 05: Battles list characterization tests

**What to build:** A DOM-level interaction test suite for the battles list page (`battles.html` /
`battles.js`), asserting on resulting DOM and `localStorage['mf0-battles']`. Written against the *current*
Mithril implementation as the regression net for that page's later Vue rewrite.

**Blocked by:** 01 (Add dev-only test tooling)

**Status:** ready-for-agent

- [ ] Covers listing of saved battles read from `localStorage['mf0-battles']`
- [ ] Covers the resume action navigating to the correct `battle.html?battleId=<id>`
- [ ] Covers the forfeit/delete action removing a battle from `localStorage['mf0-battles']`
- [ ] Suite passes against the current, unmodified Mithril implementation
