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

**Status:** ready

- [ ] `battles.html` loads the same Google Fonts link; Bootstrap CDN tags decided consistently with
      tickets 01/02
- [ ] Each saved-battle row reads as a card (date, Resume, Forfeit) at any width from 390px to
      1440px — no fixed Bootstrap column widths
- [ ] Resume and Forfeit are visually distinct (primary vs. destructive), each with real button
      labels/`aria-label`s
- [ ] Empty state uses the page's actual typography, not bare unstyled text
- [ ] `tests/helpers/load-battles-page.js` selectors updated to match new markup; no change to what
      `tests/battles.test.js` asserts
- [ ] `npx vitest run` passes
- [ ] `npx prettier --check` passes on every changed `.js` file
- [ ] Manual smoke pass at 390px, 834px, and 1440px: save two+ battles, resume one, forfeit one,
      confirm the empty state renders correctly once the list is emptied

## Comments
