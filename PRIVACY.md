# vTabs Privacy Policy

**Effective date:** 12 August 2026
**Extension:** vTabs — Save & Restore Tab Sessions

## Summary

vTabs stores your saved tab groups on your own device and nowhere else. It has
no server, no user accounts, and no analytics. It sends no data anywhere.

## What the extension handles

When you choose to save a window, vTabs records, for each unpinned tab:

- the page title
- the page URL
- the time the group was saved and the name you gave it

That is the whole of it. vTabs does not read page content, does not track
which pages you visit, does not record browsing history outside of an explicit
save, and does not touch pinned tabs.

## Where it is stored

All of it is written to your browser's local extension storage
(`chrome.storage.local`) on the device where you installed vTabs. It is not
synced to any Google account by the extension, it is not uploaded, and it is
not shared with the developer or any third party.

## Network activity

vTabs makes no network requests. It has no host permissions and cannot read or
modify any website. Site icons are drawn from the favicon cache your browser
has already built locally; no request is made to any icon service.

The only time your data leaves the extension is when **you** use the Export
button, which writes a JSON file to the download location you pick. What
happens to that file afterwards is up to you.

## Data you delete stays deleted

Deleting a group removes it from local storage immediately. Uninstalling vTabs
removes all of its stored data. There is no copy anywhere else for us to
delete, because there was never a copy anywhere else.

## Permissions and why they exist

| Permission  | Purpose |
| ----------- | ------- |
| `tabs`      | Read the titles and URLs of tabs in the current window so they can be saved, and reopen them when you restore a group. |
| `storage`   | Keep your saved groups on this device. |
| `downloads` | Write the JSON file when you use Export. |
| `favicon`   | Display site icons from the browser's local favicon cache. |

vTabs requests no host permissions, so it has no access to the content of any
page you visit.

## Children

vTabs is a general-purpose utility. It does not knowingly collect information
from anyone, of any age, beyond what is described above.

## Changes to this policy

Any change will be published in this file, with the effective date updated. The
version history is public in the repository.

## Contact

Questions or concerns: open an issue at
<https://github.com/vizneo/bookmark_extension/issues>.

vTabs is free software licensed under the AGPLv3; the complete source is at
<https://github.com/vizneo/bookmark_extension>.
