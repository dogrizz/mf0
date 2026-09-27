# 03: Apply the tactical redesign to the battles list (`battles.html`)

**What to build:** Re-skin `battles.html`, `battles.js`, `battles/vue-battles-app.js` +
`.template.html` to match ticket 01's visual language, reusing the shared classes ticket 01 adds to
`style.css`. This is the smallest page — a single list of saved battles with Resume/Forfeit actions
— and mostly a direct application of the shared patterns rather than needing new ones.

- `battles.html`: same Google Fonts link swap and Bootstrap-CDN-tags decision as tickets 01/02.
- `battles/vue-battles-app.template.html`: each battle row (`.battle.col.row...`) becomes a card
  consistent with `asset-card`'s visual weight — date/time as the primary label, Resume as a
  clearly primary button, Forfeit as a clearly destructive one (today both are same-weight
  `btn-outline-*` pairs). Consider whether Forfeit needs a confirm step (today it deletes
  immediately on click with no undo) — note this as a judgment call for whoever picks up the
  ticket, not a required change, since it's a behavior question, not purely visual.
- Empty state ("No battles yet...") gets the same typographic treatment as the rest of the page
  (currently a bare `<span>` + link) rather than looking like unstyled fallback text.
- No fleet-color concept applies here (a battles-list row doesn't belong to one fleet), so
  `fleet-dot` doesn't apply — don't force it in.

**Blocked by:** none (independent of ticket 02; only depends on ticket 01's shared `style.css`
classes existing to reuse)

**Status:** done

- [x] `battles.html` loads the same Google Fonts link; Bootstrap CDN tags decided consistently with
      tickets 01/02
- [x] Each saved-battle row reads as a card (date, Resume, Forfeit) at any width from 390px to
      1440px — no fixed Bootstrap column widths
- [x] Resume and Forfeit are visually distinct (primary vs. destructive), each with real button
      labels/`aria-label`s
- [x] Empty state uses the page's actual typography, not bare unstyled text
- [x] `tests/helpers/load-battles-page.js` selectors updated to match new markup; no change to what
      `tests/battles.test.js` asserts
- [x] `npx vitest run` passes
- [x] `npx prettier --check` passes on every changed `.js` file
- [x] Manual smoke pass at 390px, 834px, and 1440px: save two+ battles, resume one, forfeit one,
      confirm the empty state renders correctly once the list is emptied

## Comments

Implemented battles.html/battles.js/battles/vue-battles-app.{js,template.html} in the tactical
redesign's visual language, dropping Bootstrap entirely from the page (matching battle.html's
ticket-01 precedent) and reusing style.css's shared design tokens. New page-specific classes added
to style.css: `.battle-list`/`.battle-card`/`.battle-date`/`.battle-card-actions` (visual weight
matched to `asset-card` without reusing its column layout/capitalize/icon-btn-head structure, which
don't fit a date+two-buttons row) plus reusable `.btn-primary`/`.btn-danger` modifiers for
Resume/Forfeit.

Forfeit still deletes immediately on click with no confirm step, per this ticket's note that this
is a judgment call, not a required change — left as-is.

`tests/helpers/load-battles-page.js` selectors updated to the new markup; `tests/battles.test.js`
assertions unchanged except one inline `.fs-5` → `.battle-date` selector swap (a Bootstrap class
embedded directly in the test body, not routed through a helper — same precedent as
`tests/battle.test.js`'s inline `.asset-name` selector from ticket 01).

Added `tests/e2e/battles-tactical.spec.js` (Playwright, real Chromium) covering edge-to-edge
rendering, no horizontal overflow at 390px, multi-card list + forfeit-to-empty flow, and resume
navigation — all 9 e2e tests (5 existing battle-tracker + 4 new) pass. Manual smoke pass done via
screenshots at 390/834/1440px plus the empty state.

`/code-review` flagged two issues, both fixed: a stale style.css comment still describing
battles.html as not-yet-redesigned/Bootstrap-only, and `formatDate()` being called three times per
row on every render — replaced with a `battleList` computed that formats each date once and reuses
it for the label and both aria-labels.
