/**
 * The only module that touches chrome.storage.local.
 *
 * Every mutation is a read-modify-write of one big array, so concurrent
 * callers would otherwise clobber each other (two deletes racing = one of
 * them silently undone). All writes are therefore funnelled through a single
 * promise chain. This module is imported exclusively by the background
 * service worker; UI contexts go through message passing so that one queue
 * covers every writer.
 */

import { STORAGE_KEY } from "./constants";
import { normalizeImport } from "./validation";

let writeQueue = Promise.resolve();

const generateId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

export const getAllGroups = async () => {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const groups = result[STORAGE_KEY];
  return Array.isArray(groups) ? groups : [];
};

export const getGroupById = async (groupId) =>
  (await getAllGroups()).find((group) => group.id === groupId) ?? null;

/**
 * Run `mutator(groups)` serialised against every other mutation. The mutator
 * returns `{ groups, result }`; returning no `groups` key skips the write.
 */
const mutate = (mutator) => {
  const run = writeQueue.then(async () => {
    const current = await getAllGroups();
    const { groups, result } = await mutator(current);
    if (groups) await chrome.storage.local.set({ [STORAGE_KEY]: groups });
    return result;
  });
  // Keep the chain usable after a failed mutation.
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
};

export const createGroup = (name, tabs) =>
  mutate((groups) => {
    const group = {
      id: generateId(),
      name: name || `Session ${new Date().toLocaleString()}`,
      timestamp: Date.now(),
      tabs: tabs.map((tab) => ({
        id: generateId(),
        title: tab.title || tab.url,
        url: tab.url,
      })),
    };
    return { groups: [group, ...groups], result: group };
  });

export const renameGroup = (groupId, newName) =>
  mutate((groups) => {
    const index = groups.findIndex((group) => group.id === groupId);
    if (index === -1) throw new Error("Group not found");
    const updated = groups.slice();
    updated[index] = { ...updated[index], name: newName };
    return { groups: updated, result: updated[index] };
  });

export const deleteGroup = (groupId) =>
  mutate((groups) => ({
    groups: groups.filter((group) => group.id !== groupId),
    result: true,
  }));

export const deleteTab = (groupId, tabId) =>
  mutate((groups) => {
    const index = groups.findIndex((group) => group.id === groupId);
    if (index === -1) throw new Error("Group not found");

    const tabs = groups[index].tabs.filter((tab) => tab.id !== tabId);
    const updated = groups.slice();
    // Drop the group once its last tab is gone.
    if (tabs.length === 0) updated.splice(index, 1);
    else updated[index] = { ...updated[index], tabs };

    return { groups: updated, result: true };
  });

export const importGroups = (data, mergeWithExisting = true) =>
  mutate((existing) => {
    const { groups: imported, skipped } = normalizeImport(data, generateId);
    if (imported.length === 0) {
      throw new Error("No valid tab groups found in that file.");
    }
    const base = mergeWithExisting ? existing : [];
    return {
      groups: [...imported, ...base],
      result: { imported: imported.length, skipped },
    };
  });

export const getStats = async () => {
  const groups = await getAllGroups();
  return {
    totalGroups: groups.length,
    totalTabs: groups.reduce((sum, group) => sum + group.tabs.length, 0),
  };
};
