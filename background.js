let lockedSites = [];
let masterPassword = "1234";

// Load locked sites from storage immediately
chrome.storage.local.get(['lockedSites', 'masterPassword'], function(result) {
  console.log('Loaded sites:', result.lockedSites); // Debug log
  if (result.lockedSites) {
    lockedSites = result.lockedSites;
  }
  if (result.masterPassword) {
    masterPassword = result.masterPassword;
  }
});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request); // Debug log

  if (request.action === "ADD_SITE") {
    lockedSites.push(request.site);
    chrome.storage.local.set({ lockedSites: lockedSites });
    console.log('Updated locked sites:', lockedSites); // Debug log
    sendResponse({ success: true });
  }
  else if (request.action === "REMOVE_SITE") {
    lockedSites = lockedSites.filter(site => site !== request.site);
    chrome.storage.local.set({ lockedSites: lockedSites });
    console.log('Updated locked sites:', lockedSites); // Debug log
    sendResponse({ success: true });
  }
  else if (request.action === "GET_SITES") {
    sendResponse({ sites: lockedSites });
  }
  else if (request.action === "CHECK_SITE") {
    const url = new URL(request.url);
    const hostname = url.hostname;
    console.log('Checking hostname:', hostname); // Debug log
    console.log('Against locked sites:', lockedSites); // Debug log
    const isLocked = lockedSites.some(site => hostname.includes(site));
    console.log('Is locked:', isLocked); // Debug log
    sendResponse({ isLocked });
  }
  else if (request.action === "CHECK_PASSWORD") {
    sendResponse({ isCorrect: request.password === masterPassword });
  }
  return true;  // Required for async response
});
