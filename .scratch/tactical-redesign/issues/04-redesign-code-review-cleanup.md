# 04: Clean up code-review nitpicks from the tactical redesign

**What to build:** A small, presentation-only cleanup pass fixing five nitpicks a `/code-review` of
tickets 01-03 (plus the follow-on icon-overhaul commit) turned up. No visual or behavioral change
for players — same rendered output, same mutation call sites, just tidier markup/CSS/JS behind it.

Concretely:

- **Duplicated `.fleet-header` heading rule**: `style.css` has two byte-identical rules for the
  fleet header title, split only because battle/battles use `<h2>` and builder uses `<h3>` for the
  same `.fleet-header` component. Normalize to one heading level across all three pages' templates
  (or combine into a single `.fleet-header h2, .fleet-header h3 {...}` selector if there's a reason
  to keep the levels different), so there's one rule, not two.
- **Mysterious `.v`/`.k` classes**: `vue-battle-player.template.html` and
  `vue-builder-player.template.html` both use `.v`/`.k` for stat-readout value/label spans (e.g.
  `<span class="v mono">{{ player.ppa }}</span><span class="k">PPA</span>`). Rename to something
  semantic — e.g. `.stat-readout-value`/`.stat-readout-label` — matching the naming quality of the
  `.stat-readout` wrapper they already sit inside. Update `style.css` selectors to match.
- **Duplicated total formula**: `vue-builder-player.template.html` inlines
  `player.ppa * (player.hva + player.tas)` directly in the template, duplicating the identical
  formula `support/battle.js` already computes into a stored `player.total`. Compute/reuse a
  `total` in the builder the same way (via `support/builder.js`), so the formula lives in one place
  and the template just renders it.
- **Dead `system-slot-attack-select` class**: `vue-builder-system.template.html` applies this class
  alongside `.field-select`, but it has no matching `style.css` rule and no JS reference — it does
  nothing. Either give it a real rule if distinct styling was intended, or drop it from the
  template.
- **`ATTACK_TYPE_LABELS` placement**: the icon-overhaul commit added this label map to
  `support/common.js`, a domain file, despite the tactical-redesign spec's "presentation-only,
  don't rework support/*.js" constraint. It's a label map, not logic, so functionally harmless —
  but confirm it belongs there (and note why, e.g. "shared across pages the way other `common.js`
  constants are") or relocate it to a non-domain shared constants file if the team wants
  `support/` to stay strictly domain-logic-only. Whichever way, leave a clear outcome, not another
  open question.

**Blocked by:** None (all five items are independent presentation-only edits; can be done in any
order within this one ticket)

**Status:** ready-for-agent

- [ ] `.fleet-header`'s heading rule exists once in `style.css`, not twice
- [ ] `.v`/`.k` renamed to semantic class names in both battle and builder player templates, with
      `style.css` updated to match; no visual change
- [ ] Builder's `player.total` reuses the same computed formula as `support/battle.js` instead of
      inlining the arithmetic in the template
- [ ] `system-slot-attack-select` either has a real rule or is removed from the template
- [ ] `ATTACK_TYPE_LABELS`'s placement in `support/common.js` is confirmed-with-rationale or moved;
      not left as a silent scope-creep item
- [ ] `npx vitest run` passes
- [ ] `npx prettier --check` passes on every changed `.js` file
- [ ] Manual smoke pass at 390px, 834px, and 1440px on battle.html and index.html: confirm stat
      readouts and system-slot editor still render identically to before this ticket

## Comments

Raised via `/code-review` of `git diff f2531d4...HEAD` (tickets 01-03 + the icon-overhaul commit)
run against the tactical-redesign spec and this repo's documented standards. Full findings:

**Standards axis** — 1 hard violation (the duplicated `.fleet-header` rule, which contradicts the
spec's "reuse ticket 01's classes verbatim" instruction), plus 3 judgement-call smells: the `.v`/`.k`
mysterious names, the duplicated PPA×(HVA+TAs) formula, and the dead `system-slot-attack-select`
class.

**Spec axis** — 0 missing requirements (every ticket-02 checklist item verified against the diff).
1 scope-creep item: the unticketed icon-overhaul commit's `ATTACK_TYPE_LABELS` addition to
`support/common.js`, which the spec's "Out of Scope" section flags as off-limits for this
presentation-only feature. Also noted (not actioned by this ticket): ticket 02's Comments claim
`badge` was reused verbatim in the builder, but it's never actually used there — a documentation
accuracy nit, not a code change.
