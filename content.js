
function log(text) {
  chrome.runtime.sendMessage({"type": "log", "text":text});
};

log("content script loaded");

