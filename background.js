let blockedSites = [];

// Load blocked sites from storage
chrome.storage.local.get(['blockedSites'], function(result) {
  if (result.blockedSites) {
    blockedSites = result.blockedSites;
  }
});

// Listen for requests and block if URL matches
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    const url = new URL(details.url);
    if (blockedSites.some(site => url.hostname.includes(site))) {
      return { cancel: true };
    }
    return { cancel: false };
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ADD_SITE") {
    blockedSites.push(request.site);
    chrome.storage.local.set({ blockedSites: blockedSites });
    sendResponse({ success: true });
  }
  if (request.action === "REMOVE_SITE") {
    blockedSites = blockedSites.filter(site => site !== request.site);
    chrome.storage.local.set({ blockedSites: blockedSites });
    sendResponse({ success: true });
  }
  if (request.action === "GET_SITES") {
    sendResponse({ sites: blockedSites });
  }
});
