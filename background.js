let globalPassword = "";
let lockedSites = {};

chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL("registration.html") });
  });

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "setPassword") {
    globalPassword = request.password;
    sendResponse({ status: "Password set successfully" });
  }

  if (request.type === "lockSite") {
    lockedSites[request.url] = true;
    chrome.storage.local.set({ lockedSites });
    sendResponse({ status: "Site locked successfully" });
  }

  if (request.type === "unlockSite") {
    if (request.password === globalPassword) {
      delete lockedSites[request.url];
      chrome.storage.local.set({ lockedSites });
      sendResponse({ status: "Unlocked successfully", success: true });
    } else {
      sendResponse({ status: "Incorrect password", success: false });
    }
  }
});

// Retrieve locked sites on startup
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get("lockedSites", (data) => {
    lockedSites = data.lockedSites || {};
  });
});

// Block sites if they are locked
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (lockedSites[tab.url]) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
  }
});
