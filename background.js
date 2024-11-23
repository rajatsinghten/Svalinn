let lockedSites = [];
let masterPassword = "1234";

// Load locked sites and password on startup
chrome.storage.local.get(['lockedSites', 'masterPassword'], (result) => {
  if (result.lockedSites) {
    lockedSites = result.lockedSites;
  }
  if (result.masterPassword) {
    masterPassword = result.masterPassword;
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ADD_SITE") {
    lockedSites.push(request.site);
    chrome.storage.local.set({ lockedSites });
    sendResponse({ success: true });
  } else if (request.action === "REMOVE_SITE") {
    lockedSites = lockedSites.filter(site => site !== request.site);
    chrome.storage.local.set({ lockedSites });
    sendResponse({ success: true });
  } else if (request.action === "GET_SITES") {
    sendResponse({ sites: lockedSites });
  } else if (request.action === "CHECK_PASSWORD") {
    sendResponse({ isCorrect: request.password === masterPassword });
  }
  return true; // Indicate asynchronous response
});

// Inject the locked page when a site is matched
chrome.webNavigation.onCompleted.addListener((details) => {
  const url = new URL(details.url);
  const hostname = url.hostname;

  const isLocked = lockedSites.some((site) => hostname.includes(site));
  if (isLocked) {
    chrome.scripting.executeScript({
      target: { tabId: details.tabId },
      files: ["inject_locked_page.js"]
    });
  }
}, { url: [{ urlMatches: ".*" }] });
