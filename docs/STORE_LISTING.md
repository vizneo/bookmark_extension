# Chrome Web Store submission checklist

Everything the developer dashboard asks for, drafted. Copy the text straight
across; the items marked **TODO** need a human (assets, account setup).

---

## Store listing tab

**Extension name** (max 45) — comes from `manifest.json`, do not retype:

```
vTabs - Save & Restore Tab Sessions
```

**Summary / short description** (max 132) — also from the manifest:

```
Save all your open tabs to a named group, close them, and restore any group in one click. Everything stays on your device.
```

**Category:** Productivity → Workflow & Planning
**Language:** English (United States)

**Detailed description:**

```
vTabs turns a cluttered window into a single named group you can come back to.

Save every open tab with one click, optionally closing them at the same time to
clear your window. Your groups stay in a list you can search, rename, and
restore whenever you need them — as a whole window, or one tab at a time.

WHAT IT DOES

• Save the current window as a named tab group
• Optionally close those tabs as you save, to clear the window
• Restore a whole group into a new window, or open individual tabs
• Search across group names, tab titles, and URLs
• Rename groups, remove single tabs, delete groups you are done with
• Export groups to a JSON file and import them back — useful as a backup or
  for moving a session to another computer

WHAT IT DOES NOT DO

vTabs has no server, no account, and no analytics. Your saved tabs are stored
on your own device using the browser's local extension storage, and the
extension makes no network requests of its own. It requests no access to any
website, so it cannot read the pages you visit. Site icons come from the
favicon cache your browser already keeps locally.

The only time your data leaves the extension is when you press Export and
choose where to save the file.

DETAILS

• Pinned tabs are never saved or closed, so the tabs you keep permanently open
  stay where they are.
• Restoring opens tabs one at a time, so a single unusable URL cannot break the
  rest of the group.
• Free and open source under the AGPLv3. The full source code is at
  https://github.com/vizneo/bookmark_extension
```

---

## Privacy tab

**Single purpose description:**

```
vTabs saves the tabs open in a browser window as a named group stored on the
user's device, and restores those tabs later. Every feature — saving, naming,
searching, restoring, deleting, and JSON import/export of those groups — serves
that single purpose.
```

**Permission justifications** (one per requested permission):

| Permission | Justification to paste |
| --- | --- |
| `tabs` | Reading the title and URL of each tab in the current window is how a session is saved, and reopening those URLs is how it is restored. There is no way to save a tab session without them. |
| `storage` | Saved tab groups are kept in chrome.storage.local so they survive browser restarts. This is the extension's only data store. |
| `downloads` | The Export feature writes the user's tab groups to a JSON file that the user chooses a location for. Used only when the user presses Export. |
| `favicon` | Site icons shown next to each saved tab are read from the browser's local favicon cache. This replaced a third-party icon service so that no browsing data leaves the device. |

**Host permissions:** none requested.

**Remote code:** No, the extension does not use remote code. All JavaScript and
CSS is bundled in the package.

**Data usage disclosures** — tick exactly these:

- [x] **Website content** — collected. Tab URLs and page titles are stored, at
      the user's explicit request, locally on their device.
- [ ] Personally identifiable information
- [ ] Health information
- [ ] Financial and payment information
- [ ] Authentication information
- [ ] Personal communications
- [ ] Location
- [ ] Web history — *not* ticked: vTabs records only the tabs the user chooses
      to save, and never observes navigation.
- [ ] User activity
- [x] I do not sell or transfer user data to third parties
- [x] I do not use or transfer user data for purposes unrelated to the single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending

**Privacy policy URL:**

```
https://github.com/vizneo/bookmark_extension/blob/main/PRIVACY.md
```

---

## Assets — TODO

Screenshots must be taken from a real install; they cannot be generated from
the source.

- [ ] **1–5 screenshots**, 1280×800 or 640×400 PNG. Suggested set:
  1. The popup with several saved groups and the tab counts visible
  2. The Save dialog with a group name typed and "close these tabs" ticked
  3. The group page listing tabs with favicons
  4. Search filtering the list
- [ ] **Small promo tile**, 440×280 PNG (required)
- [ ] Marquee promo tile, 1400×560 PNG (optional, only for featuring)
- [ ] Replace `docs/savesessionscreenshot.png` and `docs/restoresession.gif`,
      which still show the removed Legacy interface

Icons at 16/48/128 already ship in `src/images/`.

---

## Account setup — TODO

- [ ] Pay the one-time developer registration fee, if this account has not
- [ ] Verify a contact email address in the dashboard (required before publish)
- [ ] Decide distribution: public, unlisted, or private

---

## Release process

1. Bump `version` in `package.json` (the manifest version is generated from it).
2. Merge to `main`.
3. Tag and push: `git tag v1.0.1 && git push origin v1.0.1`.
4. `.github/workflows/release.yaml` runs tests, builds, verifies the tag matches
   the manifest version, zips `build/`, attaches it to a GitHub release, and —
   if the `CWS_*` secrets are set — uploads a draft to the Web Store.
5. Publish from the Web Store dashboard. Publishing is deliberately left manual.

**Repository secrets needed for the automated upload:**

| Secret | Where it comes from |
| --- | --- |
| `CWS_EXTENSION_ID` | The item ID, visible in the dashboard URL after the first manual upload |
| `CWS_CLIENT_ID` | Google Cloud OAuth client (Chrome Web Store API enabled) |
| `CWS_CLIENT_SECRET` | Same OAuth client |
| `CWS_REFRESH_TOKEN` | Generated once against that client |

Without them the release job still runs and attaches the zip to the GitHub
release; only the store upload step is skipped.

The first submission has to be a manual upload — the API cannot create a new
item, only update an existing one.
