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

### Loading the unpacked extension

1. Run `npm run build`.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click [**Load unpacked**](./docs/loadunpacked.png) and select the `build/`
   directory (not `public/` — the manifest is generated at build time).

---

## Architecture

```
src/
  Core/background.js   Service worker. Owns every chrome.storage mutation.
  index.js             Popup entry (React).
  group-view.js        Full-page view of one group. Plain DOM, no framework.
  utils/
    storage.js         The only module that touches chrome.storage.local.
    validation.js      URL allow-list and sanitisation of imported JSON.
    messaging.js       Promise wrapper over chrome.runtime.sendMessage.
    favicon.js         Local favicon URLs via the `favicon` permission.
  components/          React popup UI (React Bootstrap).
webpack/               Shared / dev / prod webpack configs.
config/jest/           Test setup and the in-memory `chrome` API mock.
```

Two invariants worth preserving:

- **UI code never writes to storage directly.** It sends a message to the
  service worker, which is what makes the single write queue in
  `utils/storage.js` enough to prevent lost updates between the popup, the
  group page and the worker.
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
3. Open a pull request. For large changes, open an issue first.

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
- [ ] Live popup refresh via `chrome.storage.onChanged`
- [ ] Firefox and Edge builds

---

## Privacy

vTabs stores your saved groups on your device and makes no network requests of
its own. See [PRIVACY.md](./PRIVACY.md).

## License

AGPLv3. See [LICENSE.md](./LICENSE.md).
