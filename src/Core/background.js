/**
 * vTabs background service worker.
 *
 * Every storage mutation in the extension lands here, which is what makes the
 * single write queue in utils/storage.js sufficient to prevent lost updates.
 * UI contexts never touch chrome.storage directly.
 */

import {
  createGroup,
  deleteGroup,
  deleteTab,
  getAllGroups,
  getGroupById,
  getStats,
  importGroups,
  renameGroup,
} from "../utils/storage";
import { isRestorableUrl } from "../utils/validation";

const groupViewUrl = (groupId) =>
  chrome.runtime.getURL(`group-view.html?id=${encodeURIComponent(groupId)}`);

/**
 * chrome.downloads needs a URL. Service workers have no
 * URL.createObjectURL, so the JSON is base64'd into a data: URL directly —
 * simpler and more predictable than the FileReader round trip this replaces.
 */
const toJsonDataUrl = (value) => {
  const bytes = new TextEncoder().encode(JSON.stringify(value, null, 2));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:application/json;base64,${btoa(binary)}`;
};

const safeFilename = (name) => {
  const stem = String(name)
    .replace(/[^a-z0-9-_]+/gi, "_")
    .replace(/^_+|_+$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return `${stem || "vtabs"}-${date}.json`;
};

const download = async (value, filename) => {
  try {
    await chrome.downloads.download({
      url: toJsonDataUrl(value),
      filename,
      saveAs: true,
    });
    return { cancelled: false };
  } catch (error) {
    // Dismissing the "Save as" dialog is a normal outcome, not a failure.
    if (/cancel/i.test(error.message)) return { cancelled: true };
    throw error;
  }
};

const handlers = {
  async save_tab_group({ name, closeTabs }) {
    // Pinned tabs are deliberately left alone: they are the ones users expect
    // to survive a "save and close everything".
    const tabs = await chrome.tabs.query({
      currentWindow: true,
      pinned: false,
    });
    const savable = tabs.filter((tab) => isRestorableUrl(tab.url));

    if (savable.length === 0) {
      throw new Error("No savable tabs in this window.");
    }

    const group = await createGroup(name, savable);

    if (closeTabs) {
      // Open the group page *before* closing anything: removing every tab in
      // a window closes the window itself.
      await chrome.tabs.create({ url: groupViewUrl(group.id) });
      await chrome.tabs.remove(savable.map((tab) => tab.id));
    }

    return { group, skipped: tabs.length - savable.length };
  },

  async get_all_groups() {
    return { groups: await getAllGroups() };
  },

  async restore_tab_group({ groupId, deleteAfterRestore }) {
    const group = await getGroupById(groupId);
    if (!group) throw new Error("Group not found");

    const urls = group.tabs.map((tab) => tab.url).filter(isRestorableUrl);
    if (urls.length === 0)
      throw new Error("This group has no restorable tabs.");

    // One tab at a time rather than windows.create({ url: [...all] }): there,
    // a single rejected URL fails the entire restore.
    const window = await chrome.windows.create({ url: urls[0], focused: true });
    let failed = 0;
    for (const url of urls.slice(1)) {
      try {
        await chrome.tabs.create({ windowId: window.id, url, active: false });
      } catch (error) {
        console.warn("vTabs: could not restore tab", url, error);
        failed += 1;
      }
    }

    if (deleteAfterRestore) await deleteGroup(groupId);

    return {
      windowId: window.id,
      restored: urls.length - failed,
      skipped: group.tabs.length - urls.length + failed,
    };
  },

  async restore_single_tab({ groupId, tabId }) {
    const group = await getGroupById(groupId);
    if (!group) throw new Error("Group not found");

    const tab = group.tabs.find((candidate) => candidate.id === tabId);
    if (!tab) throw new Error("Tab not found");
    if (!isRestorableUrl(tab.url))
      throw new Error("That URL cannot be opened.");

    const created = await chrome.tabs.create({ url: tab.url });
    return { tabId: created.id };
  },

  async delete_tab_group({ groupId }) {
    await deleteGroup(groupId);
    return {};
  },

  async delete_single_tab({ groupId, tabId }) {
    await deleteTab(groupId, tabId);
    return {};
  },

  async update_group_name({ groupId, newName }) {
    const group = await renameGroup(groupId, newName);
    return { group };
  },

  async export_group({ groupId }) {
    const group = await getGroupById(groupId);
    if (!group) throw new Error("Group not found");
    return download(group, safeFilename(group.name));
  },

  async export_all_groups() {
    const groups = await getAllGroups();
    if (groups.length === 0) throw new Error("There is nothing to export.");
    return download(groups, safeFilename("vtabs-all-groups"));
  },

  async import_groups({ data, mergeWithExisting = true }) {
    const result = await importGroups(data, mergeWithExisting);
    return result;
  },

  async get_storage_stats() {
    return { stats: await getStats() };
  },
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Nothing outside this extension should be able to drive these handlers.
  if (sender.id !== chrome.runtime.id) return false;

  const handler = handlers[request?.action];
  if (!handler) {
    sendResponse({
      success: false,
      error: `Unknown action: ${request?.action}`,
    });
    return false;
  }

  Promise.resolve(handler(request))
    .then((data) => sendResponse({ success: true, ...data }))
    .catch((error) => {
      console.error(`vTabs: "${request.action}" failed`, error);
      sendResponse({ success: false, error: error.message });
    });

  return true; // Response is asynchronous.
});
