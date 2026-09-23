# Instructions for Claude / AI assistants working on this repo

## No Chrome / browser automation available

This machine does not have Chrome installed, so the `claude-in-chrome`
skill/extension is **never** available here — don't suggest it or try to
invoke it, in this session or future ones.

For anything that needs UI/browser verification (this is a frontend
project, so that's often):

- Default to careful code review plus a local static server
  (`python3 -m http.server` — stdlib only, works fine on this NixOS
  machine) and ask the user to click through manually. Say explicitly that
  you could not verify the UI yourself; don't claim it "works" without
  having seen it run.
- A jsdom-based repro (Node + `jsdom` + the real `alpinejs` package,
  installed ephemerally via `npm install` in a scratch dir) is fine for
  confirming an *isolated* logic/framework-behavior question (e.g. "does
  this directive read this property correctly"). Keep it small.
- **Cap it at 2-3 isolated tests.** If the bug doesn't reproduce in a
  small isolated case but only shows up against the full real file, stop
  — that's very likely a jsdom fidelity gap (it has known issues with
  microtask/script-execution timing on large documents), not a real bug.
  Say so and ask the user to verify in their own browser rather than
  building bigger test harnesses (bisection scripts, byte-diffing, etc.)
  to chase it alone.

See contents of `.ai` for the fuller story and specific gotchas found so far.
