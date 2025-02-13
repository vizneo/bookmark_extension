/* eslint-disable no-undef */
const browser = window.browser || window.browser;

browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "save_tabs") {
    try {
      let tabs = await browser.tabs.query({ currentWindow: true });

      let tabUrls = tabs.map((tab) => ({ title: tab.title, url: tab.url }));

      let blob = new Blob([JSON.stringify(tabUrls, null, 2)], {
        type: "application/json",
      });
      let reader = new FileReader();

      reader.onloadend = function () {
        let now = new Date();
        let fileName = `tabs_${now.toISOString().replace(/[:.]/g, "-")}.json`;
        let base64Data = reader.result.split(",")[1];
        browser.downloads
          .download({
            url: `data:application/json;base64,${base64Data}`,
            filename: fileName,
            saveAs: true,
          })
          .then((response) => {
            if (browser.runtime.lastError) {
              console.error(browser.runtime.lastError.message);
              sendResponse({
                success: false,
                error: browser.runtime.lastError.message,
              });
            } else {
              console.log(`Download started with ID: ${response}`);
              sendResponse({ success: true });
            }
          });
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error(error);
      sendResponse({ success: false, error: error.message });
    }
    return true; // Keeps the message channel open for sendResponse
  }
  // restore session from file.
  else if (request.action === "restore_session") {
    try {
      const urlList = request.data.map((item) => {
        return item.url;
      });
      if (urlList.length > 5) {
        console.log("Too many tabs stored. Limiting to last 3");
        const slicedArray = urlList.slice(3, urlList.length);
        await browser.windows.create({ url: slicedArray });
        console.log(response.sessionId);
        sendResponse({ success: true, sessionId: response.sessionId });
      } else {
        // Open a new window with all the URLs as separate tabs
        await browser.windows.create({ url: urlList });
        console.log(response.sessionId);
        sendResponse({ success: true, sessionId: response.sessionId });
      }
      return true; // Keeps the message channel open for sendResponse
    } catch (error) {
      console.log(error);
      sendResponse({ success: false, error: error });
    }
  }
});
