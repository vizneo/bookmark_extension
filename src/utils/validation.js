/**
 * Validation and sanitisation for anything that crosses a trust boundary:
 * imported JSON files, and URLs read back out of storage before we hand them
 * to the Chrome tabs API.
 */

/** Schemes an extension is actually allowed to navigate a tab to. */
const RESTORABLE_SCHEMES = new Set(["http:", "https:", "ftp:"]);

export const LIMITS = {
  MAX_IMPORT_BYTES: 5 * 1024 * 1024,
  MAX_GROUPS: 1000,
  MAX_TABS_PER_GROUP: 2000,
  MAX_TITLE_LENGTH: 500,
  MAX_URL_LENGTH: 4096,
  MAX_NAME_LENGTH: 200,
};

/**
 * True if Chrome will let us open this URL in a tab. Deliberately an
 * allow-list: it rejects javascript:, data:, chrome:, chrome-extension: and
 * file:, all of which either fail at runtime or are an injection vector.
 */
export const isRestorableUrl = (url) => {
  if (typeof url !== "string" || url.length > LIMITS.MAX_URL_LENGTH)
    return false;
  try {
    return RESTORABLE_SCHEMES.has(new URL(url).protocol);
  } catch {
    return false;
  }
};

const clampString = (value, maxLength, fallback = "") => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
};

/**
 * Turn one untrusted tab-shaped object into a tab we are willing to store,
 * or null if it is unusable.
 */
const sanitizeTab = (raw, generateId) => {
  if (!raw || typeof raw !== "object") return null;
  if (!isRestorableUrl(raw.url)) return null;
  return {
    id: clampString(raw.id, 64) || generateId(),
    title: clampString(raw.title, LIMITS.MAX_TITLE_LENGTH, raw.url),
    url: raw.url,
  };
};

const sanitizeTimestamp = (value) => {
  const timestamp = Number(value);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : Date.now();
};

/**
 * Normalise arbitrary parsed JSON into groups we can store.
 *
 * Accepts the current group format, a bare array of groups, and the legacy
 * flat `[{title, url}, ...]` session files written by earlier versions.
 *
 * Returns the usable groups plus counts of what was dropped, so the UI can
 * tell the user their file was only partly imported instead of silently
 * swallowing half of it.
 */
export const normalizeImport = (data, generateId) => {
  const skipped = { groups: 0, tabs: 0 };
  const groups = [];

  const items = Array.isArray(data) ? data : [data];
  if (items.length === 0) return { groups, skipped };

  // Legacy format: a flat array of tabs with no group wrapper. Collect them
  // all into one group rather than creating one group per tab.
  const legacyTabs = [];

  for (const item of items) {
    if (!item || typeof item !== "object") {
      skipped.groups += 1;
      continue;
    }

    if (Array.isArray(item.tabs)) {
      if (groups.length >= LIMITS.MAX_GROUPS) {
        skipped.groups += 1;
        continue;
      }
      const tabs = [];
      for (const rawTab of item.tabs.slice(0, LIMITS.MAX_TABS_PER_GROUP)) {
        const tab = sanitizeTab(rawTab, generateId);
        if (tab) tabs.push(tab);
        else skipped.tabs += 1;
      }
      skipped.tabs += Math.max(0, item.tabs.length - LIMITS.MAX_TABS_PER_GROUP);
      if (tabs.length === 0) {
        skipped.groups += 1;
        continue;
      }
      groups.push({
        id: clampString(item.id, 64) || generateId(),
        name: clampString(item.name, LIMITS.MAX_NAME_LENGTH, "Imported group"),
        timestamp: sanitizeTimestamp(item.timestamp),
        tabs,
      });
      continue;
    }

    const legacyTab = sanitizeTab(item, generateId);
    if (legacyTab) legacyTabs.push(legacyTab);
    else skipped.tabs += 1;
  }

  if (legacyTabs.length > 0 && groups.length < LIMITS.MAX_GROUPS) {
    groups.push({
      id: generateId(),
      name: `Imported session ${new Date().toLocaleString()}`,
      timestamp: Date.now(),
      tabs: legacyTabs.slice(0, LIMITS.MAX_TABS_PER_GROUP),
    });
  }

  return { groups, skipped };
};

/**
 * Guard against a file large enough to blow the 10 MB chrome.storage.local
 * quota before we have even parsed it.
 */
export const assertImportSize = (byteLength) => {
  if (byteLength > LIMITS.MAX_IMPORT_BYTES) {
    const limitMb = Math.round(LIMITS.MAX_IMPORT_BYTES / (1024 * 1024));
    throw new Error(`File is too large to import (limit ${limitMb} MB).`);
  }
};
