# Instructions for Claude / AI assistants working on this repo

## UI/browser verification

This is a frontend project, so many changes need UI/browser verification.
Whether browser automation (e.g. a claude-in-chrome-style tool) is
available depends on the machine/environment you're running in this
session — check what's actually available rather than assuming either way.

When browser automation isn't available:

- Default to careful code review plus a local static server
  (`python3 -m http.server` or equivalent) and ask the user to click
  through manually. Say explicitly that you could not verify the UI
  yourself; don't claim it "works" without having seen it run.
- A jsdom-based repro (Node + `jsdom` + the real `alpinejs` package —
  either the checked-in `tests/` harness, or one installed ephemerally via
  `npm install` in a scratch dir) is fine for confirming an *isolated*
  logic/framework-behavior question (e.g. "does this directive read this
  property correctly"). Keep it small.
- **Cap it at 2-3 isolated tests.** If the bug doesn't reproduce in a
  small isolated case but only shows up against the full real file, stop
  — that's very likely a jsdom fidelity gap (it has known issues with
  microtask/script-execution timing on large documents), not a real bug.
  Say so and ask the user to verify in their own browser rather than
  building bigger test harnesses (bisection scripts, byte-diffing, etc.)
  to chase it alone.

See contents of `.ai` (gitignored, local working notes) for
machine/environment-specific details and the fuller story of specific
gotchas found so far.
