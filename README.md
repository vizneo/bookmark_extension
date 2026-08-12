# vTabs

**vTabs** is a Chrome (Manifest V3) extension that saves the tabs you have open
into a named group, closes them if you want, and brings any group back in one
click. Groups can be exported to JSON and imported again, which is also how you
move a session between browsers or machines.

Everything is stored on your device with the Chrome storage API. vTabs has no
server, no account, and no analytics, and makes no network requests of its own.

---

## Features

- **Save a window** — every unpinned web tab in the current window becomes one
  named group. Pinned tabs are never saved or closed.
- **Close on save** — the OneTab-style workflow: store the group and clear the
  window in a single action.
- **Restore** — reopen a whole group in a new window, or a single tab at a time
  from the group page. Tabs are opened one by one, so one bad URL cannot fail
  the whole restore.
- **Search** — filter across group names, tab titles and URLs.
- **Live updates** — the popup and any open group page stay in sync with each
  other; renaming or deleting in one shows up in the other immediately.
- **Import / export** — JSON files, including the flat `[{title, url}]` format
  written by earlier versions of this extension.

---

## Development

Requires Node.js 20 or newer.

```bash
npm ci           # install dependencies
npm test         # run the Jest suite
npm run lint     # eslint
npm run format   # rewrite with prettier (format:check to verify only)
npm run build    # production build into build/
npm run dev      # development build, rebuilt on every change
npm run package  # build and zip build/ into vtabs.zip for the Web Store
```

CI runs lint, the formatting check, the tests and a build on every branch and
pull request, across Node 20 and 22.

There is no dev server. The popup calls `chrome.*` APIs as it loads, so it only
runs as an installed extension. Leave `npm run dev` running and press reload on
the extension in `chrome://extensions` to pick up a change.

---

## Testing locally

`npm test` covers the storage layer, import validation and the popup's
rendering against a mock `chrome` API. It cannot cover the parts that only
exist inside a real browser — the service worker, tab manipulation, favicon
rendering and the download flow — so changes to those need a pass by hand.

### 1. Load the extension

1. Run `npm run build`.
2. Open `chrome://extensions` and turn on **Developer mode** (top right).
3. Click [**Load unpacked**](./docs/loadunpacked.png) and select the `build/`
   directory — not `public/`, which has no generated manifest and will fail to
   load.

The vTabs icon appears in the toolbar. Pin it so it stays visible while you
test.

### 2. Pick up a change

Leave `npm run dev` running; it rebuilds `build/` on every save. Then, on the
extension's card in `chrome://extensions`:

- press the **reload** arrow after changing `background.js`, the manifest, or
  anything in `public/`
- for popup or group-page changes, just close and reopen the popup or reload
  the page

If the card shows a red **Errors** button, open it first — a service worker
that failed to parse will make every action fail with "No response from the
background service worker."

### 3. Open the right console

Each part of the extension has its own devtools:

| Part           | How to open it                                      |
| -------------- | --------------------------------------------------- |
| Service worker | The **service worker** link on the extension's card |
| Popup          | Right-click the toolbar icon → **Inspect popup**    |
| Group page     | It is an ordinary tab — F12                         |

An MV3 service worker stops after roughly 30 seconds idle, which is normal.
Opening its console wakes it, and any message from the UI restarts it.

### 4. Inspect and reset stored data

From the service worker console:

```js
await chrome.storage.local.get("tabGroups"); // read everything
await chrome.storage.local.clear(); // wipe it and start clean
```

Wiping storage fires the change event, so an open popup empties itself as you
watch — which doubles as a check that live updates work.

### 5. Manual checklist

Worth walking once before a release, and after touching anything below.

**Saving**

- [ ] Save without closing — the group appears, tabs stay open
- [ ] Save **with** "close these tabs" — the window stays open on the group
      page rather than disappearing, and the other tabs are gone
- [ ] A pinned tab is neither saved nor closed
- [ ] With a `chrome://` tab open, the notice reports it as skipped

**Restoring**

- [ ] "Open all" opens a new window with every tab
- [ ] "Open & remove" opens them and drops the group from the list
- [ ] From the group page, clicking one tab opens just that one

**Editing**

- [ ] Rename: Enter commits, Escape cancels, clicking away commits
- [ ] Remove a tab on the group page; removing the last one deletes the group
- [ ] Delete a group from the popup, confirm prompt and all
- [ ] Search matches group names, tab titles and URLs

**Files**

- [ ] Export one group, and export all — both open a Save dialog
- [ ] Cancelling that dialog is not reported as an error
- [ ] Re-import the exported file; the groups come back
- [ ] Import a file of nonsense JSON — a readable error, no crash
- [ ] Import a legacy flat `[{title, url}]` file; it lands as one group

**Live updates and privacy**

- [ ] With the popup and a group page both open, delete a tab on the page —
      the popup's counts update without being touched
- [ ] Open devtools on the group page, reload it, and check the Network tab:
      no requests to any external host. Favicons must come from
      `chrome-extension://…/_favicon/`.

---

## Architecture

```
src/
  Core/background.js   Service worker. Owns every chrome.storage mutation.
  index.js             Popup entry (React).
  group-view.js        Full-page view of one group. Plain DOM, no framework.
  utils/
    storage.js         Writes to chrome.storage.local, serialised.
    storageEvents.js   Subscribes to storage changes, for live updates.
    constants.js       The storage key, shared by both of the above.
    validation.js      URL allow-list and sanitisation of imported JSON.
    messaging.js       Promise wrapper over chrome.runtime.sendMessage.
    favicon.js         Local favicon URLs via the `favicon` permission.
  components/          React popup UI (React Bootstrap).
webpack/               Shared / dev / prod webpack configs.
config/jest/           Test setup and the in-memory `chrome` API mock.
```

Three invariants worth preserving:

- **UI code never writes to storage directly.** It sends a message to the
  service worker, which is what makes the single write queue in
  `utils/storage.js` enough to prevent lost updates between the popup, the
  group page and the worker.
- **Nothing refetches after a mutation.** State flows back out through
  `chrome.storage.onChanged`, so every open view updates itself. A manual
  refresh on top is a redundant round trip and a second render.
- **Anything that came from a file is untrusted.** Imported JSON goes through
  `normalizeImport`, and URLs are checked against an allow-list before they
  reach the tabs API or the DOM.

The extension version comes from `package.json`; webpack writes it into
`manifest.json` at build time, so bump it in one place.

---

## Permissions

| Permission  | Why                                                                         |
| ----------- | --------------------------------------------------------------------------- |
| `tabs`      | Read titles and URLs of open tabs to save them, and reopen them on restore. |
| `storage`   | Keep saved groups on this device.                                           |
| `downloads` | Write the JSON file when you export.                                        |
| `favicon`   | Show site icons from Chrome's local favicon cache.                          |

---

## Contributing

1. Fork the repository and branch from `main`.
2. Make your change, with tests where it is testable.
3. Run `npm run format` — CI fails on unformatted files.
4. If you touched the service worker, tab handling or the group page, walk the
   [manual checklist](#5-manual-checklist); the Jest suite cannot reach those.
5. Open a pull request. For large changes, open an issue first.

Report bugs on the
[issue tracker](https://github.com/vizneo/bookmark_extension/issues).

---

## Releasing

Bump `version` in `package.json`, merge to `main`, then tag:

```bash
git tag v1.0.1 && git push origin v1.0.1
```

`.github/workflows/release.yaml` tests, builds, checks the tag against the
manifest version, zips `build/`, attaches it to a GitHub release, and uploads a
draft to the Chrome Web Store if the `CWS_*` secrets are configured. Publishing
stays manual.

The full submission checklist — listing copy, permission justifications, data
disclosures and the assets still to produce — is in
[docs/STORE_LISTING.md](./docs/STORE_LISTING.md).

---

## Roadmap

- [ ] Store assets: screenshots and the 440×280 promo tile
- [ ] Keyboard shortcut and context-menu entry
- [ ] Firefox and Edge builds

---

## Privacy

vTabs stores your saved groups on your device and makes no network requests of
its own. See [PRIVACY.md](./PRIVACY.md).

## License

AGPLv3. See [LICENSE.md](./LICENSE.md).
