let masterPassword = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SET_MASTER_PASSWORD") {
    masterPassword = message.payload;
    sendResponse({ success: true });
    return true;
  }

  if (message.type === "GET_MASTER_PASSWORD") {
    sendResponse({ password: masterPassword });
    return true;
  }
});
