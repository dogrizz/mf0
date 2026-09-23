# Regression tests

jsdom-based tests for the Alpine.js frontend. The site itself has no build
step and stays that way - this is dev-only tooling, kept separate with its
own `package.json`.

```sh
cd tests
npm install
npm test
```

Uses Node's built-in test runner (`node --test`, Node 18+) plus `jsdom` and
the real `alpinejs` package (pinned to the same version the pages load from
CDN). `helpers/load-page.js` loads the actual `index.html`/`battle.html`
files from the repo - not synthetic snippets - so a regression in the real
markup or component wiring shows up here.

See `.ai/alpine-migration.md` (gitignored, local notes) for the Alpine
gotchas each test locks in.
