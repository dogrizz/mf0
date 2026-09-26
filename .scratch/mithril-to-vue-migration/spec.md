# Migrate off Mithril to Vue 3 (no-build)

Triage: ready-for-agent

## Problem Statement

Mithril, the UI framework underlying all three pages of this tool (the fleet builder, the battle
tracker, and the battles list), hasn't had a release in years, and its hyperscript API
(`m(selector, attrs, children)`) jumbles presentation *structure* together with presentation *logic*
in the same nested calls. This makes the view-layer code harder to read and maintain, especially on
the fleet builder page, which has intricate cross-component interactions (ships, systems, mech
companies, catapults, live PPA recalculation). There is also no test suite today, so any change to
this already-hard-to-read, untested view layer risks silently breaking those interactions.

## Solution

Replace Mithril with Vue 3, loaded via its no-build CDN "global build" so the project's intentional
no-build-step, no-backend, GitHub-Pages-only architecture is unchanged. Each UI component is authored
as a literal separate template file and logic file — an Angular-inspired split that genuinely
decouples structure from logic, unlike Mithril's hyperscript — using Vue's Composition API with an
explicit `setup()` function (not the `<script setup>` shorthand, which needs a compiler).

Before any view code changes, add a dev-only test suite covering the domain logic and the current,
observable page behavior, then do a CSS cleanup pass while the markup is still stable, then migrate
pages one at a time — fleet builder first (highest complexity, surfaces pattern problems early), then
battle tracker, then battles list — merging each page to `main` as soon as it is completed and
verified.

## User Stories

**Behavior preservation**

1. As a player using the fleet builder, I want all existing fleet-building behavior (adding ships,
   systems, mech companies, catapults, PPA calculation) to work exactly as before, so migrating
   frameworks doesn't disrupt my games.
2. As a player using the battle tracker, I want per-system damage tracking, ship/company destruction,
   fuel state, and ship capture/transfer to keep working identically, so I can continue live battles
   without interruption.
3. As a player using the battles list, I want to keep seeing my saved battles with working
   resume/forfeit actions.
4. As a player, I want my existing `localStorage` data (`mf0-tools`, `mf0-battles`) to keep loading
   correctly after the migration, so I don't lose my fleets or in-progress battles.
5. As a player, I want the site to keep working with no backend, no account, and no install step —
   just opening the page in a browser — so the tool stays free and infrastructure-less.
6. As a player using the fleet builder, I want the intricate interactions between related parts of the
   page (e.g. a ship's catapult system enabling a mech company, ship class affecting available
   systems, PPA recalculating live as the roster changes) to keep working unchanged, since these are
   the highest-risk behaviors in the whole migration.

**Maintainer / dev-experience**

7. As the maintainer, I want each component's markup and logic in separate files, so presentation
   structure and presentation logic are no longer jumbled the way Mithril's hyperscript jumbles them.
8. As the maintainer, I want the new framework loaded via CDN with no bundler or build step, so the
   project keeps its zero-infrastructure deployment model.
9. As the maintainer, I want a dev-only test suite that doesn't affect what ships to GitHub Pages, so
   I can verify behavior without adding runtime complexity to the deployed site.
10. As the maintainer, I want unit tests covering the domain logic module's exported behavior (PPA
    calculation, dice notation, role assignment, battle persistence and migration), so core
    game-scoring logic is protected independent of any UI framework.
11. As the maintainer, I want page-level characterization tests written against the current Mithril
    behavior before migration starts, so I have a regression safety net to run against each Vue
    rewrite.
12. As the maintainer, I want the fleet-builder page's test suite to specifically exercise its
    cross-component interactions, since that page is the riskiest and migrates first.
13. As the maintainer, I want to migrate the fleet builder first, so pattern problems with the new
    component approach surface early rather than late.
14. As the maintainer, I want each page's migration merged to `main` independently as soon as it's
    done and verified, so the site can safely run a mix of Mithril and Vue pages during the transition
    without breaking anything.
15. As the maintainer, I want a temporary duplicate of the tiny shared component module (the nav-link
    and footer components used by every page) — one Mithril version, one Vue version — during the
    transition, collapsing to a single Vue version once the last page migrates, so unmigrated pages
    aren't broken by a premature shared implementation.
16. As the maintainer, I want a CSS review pass after tests are added but before any page migration
    starts, so dead/duplicated rules, magic-number spacing, `!important` overuse, and layout hacks get
    cleaned up while the markup is still stable, rather than being carried forward into new Vue
    templates.
17. As the maintainer, I want before/after screenshots of each page taken as part of the CSS review,
    so visual regressions that behavior tests can't catch get caught by eye.
18. As the maintainer, I want each component authored with Vue's Composition API using an explicit
    `setup()` function, so the code stays idiomatic modern Vue while still respecting the no-build
    constraint.
19. As the maintainer, I want test-tooling directories (`node_modules/`, test-artifact output) added
    to `.gitignore` as part of adding the test tooling, so the repo doesn't accidentally track
    generated files.
20. As the maintainer, I want the page-level DOM/behavior tests to remain as permanent integration
    tests even after finer-grained per-component tests exist later, so there is always an end-to-end
    safety net at the page level, not just component-level coverage.
21. As the maintainer, I want the option, once the whole migration is complete and confirmed, to
    further split the per-page test suites into more specific per-component tests, so a test failure
    can point at the responsible component rather than just the page.

## Implementation Decisions

- **Framework**: Vue 3, loaded via its CDN global build, replacing Mithril across all three pages. No
  bundler or npm build step is introduced into the deployed site — the CDN-only, no-backend
  architecture is preserved exactly.
- **Component authoring**: each component is authored as two separate files — a template file
  (markup) and a logic file (Composition API `setup()`, refs, computed values, methods) — fetched and
  registered at runtime. No compile step is needed since Vue's global build ships a runtime template
  compiler.
- **API style**: Composition API, explicit `setup()` per component. The `<script setup>` shorthand is
  not used, since it requires a build step.
- **Migration order**: fleet builder first (highest complexity, most intricate cross-component
  interactions, most likely place for bugs to emerge in the transliteration), then battle tracker,
  then battles list.
- **Rollout**: each page's migration merges to `main` independently as soon as it's completed and
  verified. Because the three pages are already independent (no shared router or app shell), the site
  can safely run a mix of Mithril and Vue pages simultaneously in production during the transition.
- **Shared components**: the small shared module (nav-link + footer components used by every page)
  gets a temporary duplicate Vue version alongside the existing Mithril version during the transition;
  the Mithril copy retires once the last page (battles list) migrates.
- **Domain logic module**: unchanged by this migration — it already has no framework dependency and is
  reused as-is by every migrated page.
- **Test tooling**: a `package.json` is added purely for dev-time tooling (test runner + DOM
  environment), with no effect on the deployed static site.
- **Sequencing**: (1) add test tooling and write the test suites described below against the current
  Mithril implementation, (2) do a CSS review/cleanup pass while markup is still stable, capturing
  before/after screenshots per page, (3) migrate pages one at a time in the order above, merging each
  to `main` once its characterization tests pass against the Vue rewrite.
- **CSS review scope**: dead or duplicated rules, magic-number spacing/colors that should become CSS
  custom properties, overly specific selectors or `!important` usage, and layout hacks replaceable by
  modern flexbox/grid. Done before any page's markup changes so the new Vue templates are written
  against clean class names rather than carrying forward existing jank.

## Testing Decisions

- Good tests here assert on external, user-visible behavior — DOM state and `localStorage` content
  after an interaction — never on Mithril- or Vue-specific internals, so the same test continues to
  pass regardless of which framework renders the page.
- Two test seams, the highest available and reused rather than multiplied:
  1. **Domain logic module** — direct unit tests calling its exported functions with plain JS objects,
     asserting on return values and, for the persistence functions, on resulting `localStorage`
     contents. No DOM required.
  2. **Rendered page** — DOM-level interaction tests, one suite per page (fleet builder, battle
     tracker, battles list), driving each page exactly as a person would (click, fill, toggle) and
     asserting on resulting DOM and `localStorage`.
- Page-level tests are written first against the *current* Mithril implementation as characterization
  tests, then re-run unchanged against each page's Vue rewrite as the regression net for that
  migration step.
- The fleet-builder page's suite specifically covers its cross-component interactions (catapult
  systems enabling mech companies, ship class changes affecting available systems, live PPA
  recalculation), since that's the highest-risk area and the first page to migrate.
- Scope for now: the rendered-page seam stays at the page level, not split per component. Once the
  migration is complete and confirmed, the page-level suites can be split further into per-component
  tests — but the page-level integration tests are kept permanently as an end-to-end safety net, not
  discarded once component-level tests exist.
- No prior art exists in this codebase for either seam — no test suite exists today.

## Out of Scope

- Changes to game rules, scoring logic, or the domain model (PPA calculation, dice/company-dice
  notation, role assignment, battle persistence format) beyond what's needed to keep it
  framework-agnostic — it already is.
- Changes to the `localStorage` schema/keys (`mf0-tools`, `mf0-battles`) or the compressed battle data
  format.
- Any new backend, database, account system, or cross-device sync — the no-infrastructure constraint
  stays exactly as it is today.
- Router or URL-scheme changes (`battle.html?battleId=...` stays as-is).
- Component-level test granularity in this pass — explicitly deferred to a follow-up once the
  migration is complete and confirmed.
- Any build step for the deployed site — Vue's global/CDN build is the only build-related decision,
  and it only touches dev/test tooling, never deployment.
- Visual redesign — the CSS review is a cleanup pass (dead rules, magic numbers, `!important`, layout
  hacks), not a restyle.

## Further Notes

- This migration was scoped through an interactive design-grill session; API style (Composition over
  Options), migration ordering (hardest page first), and the CSS-review insertion point were all
  settled interactively after an initial recommendation-based draft, based on the maintainer's stated
  preference to learn the idiomatic Vue style directly rather than transliterate through an
  intermediate style.
- Mithril is not actively broken — this is proactive risk management (no releases in years) combined
  with a real ergonomics complaint about hyperscript mixing structure and logic, not an urgent fix.
- The domain logic module's complete independence from Mithril (confirmed: no framework-specific
  calls anywhere in it) is what keeps this migration's blast radius contained to the view layer.
