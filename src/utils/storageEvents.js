import { STORAGE_KEY } from "./constants";

/**
 * Subscribe to saved-group changes.
 *
 * chrome.storage.onChanged fires in every extension context, so a change made
 * by the service worker on behalf of the group page reaches an open popup too.
 * The event carries the new value, so no message round trip is needed to find
 * out what changed.
 *
 * Reading here does not break the single-writer rule: writes still go through
 * the background, this only observes the result.
 *
 * @param {(groups: object[]) => void} listener
 * @returns {() => void} unsubscribe
 */
export const onGroupsChanged = (listener) => {
  const handler = (changes, areaName) => {
    if (areaName !== "local") return;

    const change = changes[STORAGE_KEY];
    if (!change) return;

    // newValue is absent when the key is removed entirely.
    listener(Array.isArray(change.newValue) ? change.newValue : []);
  };

  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
};
