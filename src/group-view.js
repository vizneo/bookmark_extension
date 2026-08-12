/**
 * Full-page view for a single tab group.
 *
 * Everything here is built with DOM nodes rather than innerHTML: group names,
 * titles and URLs can all originate from an imported file, and string
 * interpolation into markup was previously an injection vector.
 */

import "./group-view.css";
import { faviconUrl } from "./utils/favicon";
import { sendMessage } from "./utils/messaging";

const groupId = new URLSearchParams(window.location.search).get("id");

const el = (id) => document.getElementById(id);

let currentGroup = null;

const showStatus = (message, tone = "info") => {
  const status = el("status");
  status.textContent = message;
  status.dataset.tone = tone;
  status.hidden = false;
};

const showError = () => {
  el("loading").hidden = true;
  el("content").hidden = true;
  el("error").hidden = false;
};

const createTabItem = (tab) => {
  const item = document.createElement("li");
  item.className = "tab-item";

  const icon = document.createElement("img");
  icon.className = "tab-favicon";
  icon.alt = "";
  icon.src = faviconUrl(tab.url);
  icon.addEventListener("error", () => {
    icon.style.visibility = "hidden";
  });

  const button = document.createElement("button");
  button.type = "button";
  button.className = "tab-open";

  const title = document.createElement("div");
  title.className = "tab-title";
  title.textContent = tab.title;

  const url = document.createElement("div");
  url.className = "tab-url";
  url.textContent = tab.url;

  button.append(title, url);
  button.addEventListener("click", async () => {
    try {
      await sendMessage({
        action: "restore_single_tab",
        groupId,
        tabId: tab.id,
      });
    } catch (error) {
      showStatus(`Could not open that tab: ${error.message}`, "error");
    }
  });

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "btn tab-remove";
  remove.textContent = "Remove";
  remove.title = `Remove "${tab.title}" from this group`;
  remove.addEventListener("click", async () => {
    try {
      await sendMessage({ action: "delete_single_tab", groupId, tabId: tab.id });
      // Deleting the last tab deletes the group, so re-read rather than
      // patching the DOM and guessing.
      await loadGroup();
      showStatus("Tab removed.");
    } catch (error) {
      showStatus(`Could not remove that tab: ${error.message}`, "error");
    }
  });

  item.append(icon, button, remove);
  return item;
};

const displayGroup = (group) => {
  el("loading").hidden = true;
  el("content").hidden = false;

  document.title = `${group.name} — vTabs`;
  el("groupName").textContent = group.name;
  el("tabCount").textContent = `${group.tabs.length} tab${
    group.tabs.length === 1 ? "" : "s"
  }`;
  el("timestamp").textContent = new Date(group.timestamp).toLocaleString();

  const list = el("tabsList");
  list.replaceChildren(...group.tabs.map(createTabItem));
};

const restoreAll = async (deleteAfterRestore) => {
  if (
    deleteAfterRestore &&
    !window.confirm(`Open all tabs and delete "${currentGroup.name}"?`)
  ) {
    return;
  }

  try {
    const response = await sendMessage({
      action: "restore_tab_group",
      groupId,
      deleteAfterRestore,
    });

    const skipped = response.skipped
      ? ` ${response.skipped} could not be opened.`
      : "";
    showStatus(`Opened ${response.restored} tabs.${skipped}`);

    if (deleteAfterRestore) window.close();
  } catch (error) {
    showStatus(`Failed to open tabs: ${error.message}`, "error");
  }
};

const loadGroup = async () => {
  if (!groupId) {
    showError();
    return;
  }

  try {
    const { groups } = await sendMessage({ action: "get_all_groups" });
    currentGroup = groups.find((group) => group.id === groupId);

    if (!currentGroup) {
      showError();
      return;
    }

    displayGroup(currentGroup);
  } catch (error) {
    console.error("vTabs: could not load group", error);
    showError();
  }
};

// Bound once: loadGroup() re-runs after edits and would otherwise stack up
// duplicate listeners.
el("restoreAllBtn").addEventListener("click", () => restoreAll(false));
el("restoreAndDeleteBtn").addEventListener("click", () => restoreAll(true));
el("backBtn").addEventListener("click", () => window.close());
el("errorCloseBtn").addEventListener("click", () => window.close());

loadGroup();
