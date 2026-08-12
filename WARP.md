# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

vTabs is a Chrome Manifest V3 extension that saves the open tabs of a window as
a named group and restores them later. Groups live in `chrome.storage.local`;
JSON import/export moves them between browsers. There is no backend.

## Commands

```bash
npm ci           # install
npm test         # jest
npm run lint     # eslint (flat config in eslint.config.mjs)
npm run format   # prettier --write; format:check verifies without writing
npm run build    # production build -> build/
npm run dev      # development build, --watch
npm run package  # build + zip to vtabs.zip
```

Lint and formatting are enforced in CI, so run `npm run format` before
committing.

Run a single test file: `npm test -- storage.test.js`

The Jest suite mocks the `chrome` API, so it cannot exercise the service
worker, tab manipulation, favicons or downloads. README.md has a "Testing
locally" section with the devtools entry points and a manual checklist for
those; use it after changing anything in `Core/background.js` or `group-view.js`.

Load the extension from `chrome://extensions` → Developer mode → Load unpacked →
select `build/`.

There is deliberately no dev server: the popup touches `chrome.*` at import
time and cannot run on a localhost page. Use `npm run dev` and reload the
extension. Source maps must stay eval-free — the MV3 CSP forbids
`'unsafe-eval'`, so an `eval-*` devtool value breaks the extension.

## Architecture

Three webpack entry points, all emitted to `build/`:

- `main` (`src/index.js`) — React popup, rendered into `index.html`
- `background` (`src/Core/background.js`) — MV3 service worker
- `group-view` (`src/group-view.js`) — full-page view of one group, plain DOM

`optimization.splitChunks` deliberately excludes `background`: the service
worker is a classic worker and must stay a single file.

### Message passing

The popup and group page never touch `chrome.storage` directly. They send
messages through `utils/messaging.js` (a promise wrapper that surfaces
`chrome.runtime.lastError`) to a handler map in `background.js`. Because the
service worker is the only writer, the single promise queue in
`utils/storage.js` is sufficient to serialise read-modify-write cycles and
prevent lost updates.

Handlers: `save_tab_group`, `get_all_groups`, `restore_tab_group`,
`restore_single_tab`, `delete_tab_group`, `delete_single_tab`,
`update_group_name`, `export_group`, `export_all_groups`, `import_groups`,
`get_storage_stats`.

### Live updates

Messages go one way, in; state comes back out through
`chrome.storage.onChanged`, wrapped by `utils/storageEvents.js`. The popup and
the group page each subscribe once and re-render from the event payload, so a
change made in one context appears in the other without polling.

The practical rule: **do not refetch after a mutation.** A successful handler
writes to storage, the write fires the event, and every open view updates
itself. Adding a manual refresh on top produces a redundant round trip and a
second render.

### Trust boundaries

- Imported JSON is untrusted. It goes through `normalizeImport` in
  `utils/validation.js`, which sanitises fields, enforces size limits and drops
  entries it cannot use.
- URLs are checked with `isRestorableUrl` (allow-list: `http:`, `https:`,
  `ftp:`) before reaching `chrome.tabs.create` or the DOM.
- `group-view.js` builds DOM nodes rather than assigning `innerHTML`, and the
  extension pages run under an explicit `script-src 'self'` CSP, so inline
  event-handler attributes will not execute.

### Versioning

`package.json` is the single source of truth. `webpack.common.js` rewrites the
`version` field of `public/manifest.json` during the copy step, so
`public/manifest.json` is not directly loadable as an unpacked extension —
always load `build/`.

## Conventions

- Babel config lives in `.babelrc` and uses the automatic JSX runtime, so JSX
  files do not need to import React.
- Tests are co-located as `*.test.js`. `config/jest/setupTests.js` installs an
  in-memory `chrome` API mock; extend it there rather than mocking per file.
- Favicons come from Chrome's local cache via the `favicon` permission
  (`utils/favicon.js`). Do not reintroduce a remote favicon service — it would
  leak browsing data and contradict the extension's privacy claims.
