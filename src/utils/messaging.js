/**
 * Promise wrapper around chrome.runtime.sendMessage.
 *
 * Callback-style sendMessage reports transport failures through
 * chrome.runtime.lastError, which must be read or Chrome logs an unchecked
 * error. Every caller in this extension goes through here so that a dead
 * service worker surfaces as a rejected promise instead of an undefined
 * response.
 */
export const sendMessage = (message) =>
  new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }
      if (!response) {
        reject(new Error("No response from the background service worker."));
        return;
      }
      if (!response.success) {
        reject(new Error(response.error || "Unknown error"));
        return;
      }
      resolve(response);
    });
  });
