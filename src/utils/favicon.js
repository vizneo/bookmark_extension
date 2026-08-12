/**
 * Favicons come from Chrome's own on-device cache via the `favicon`
 * permission. The previous implementation fell back to
 * google.com/s2/favicons, which leaked every saved hostname to a third party
 * and contradicted the extension's "nothing leaves your device" claim.
 */
export const faviconUrl = (pageUrl, size = 32) => {
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", pageUrl);
  url.searchParams.set("size", String(size));
  return url.toString();
};
