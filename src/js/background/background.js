
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('isRegistered', (data) => {
    if (chrome.runtime.lastError) {
      openWelcomePage();
      return;
    }
    if (!data.isRegistered) {
      openWelcomePage();
    }
  });
});

function openWelcomePage() {
  const welcomePageUrl = chrome.runtime.getURL("src/pages/welcome.html");
  chrome.tabs.create({ url: welcomePageUrl });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "setPassword") {
    chrome.storage.local.set({ masterPassword: request.password }, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ status: "Error saving password" });
      } else {
        sendResponse({ status: "Password set successfully" });
      }
    });
    return true;
  }
});

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.url.startsWith(chrome.runtime.getURL("")) || !details.url.startsWith("http")) {
    return;
  }

  try {
    const { lockedSites, isRegistered } = await chrome.storage.local.get(["lockedSites", "isRegistered"]);
    const { unlockedSites } = await chrome.storage.session.get("unlockedSites");

    if (!isRegistered) {
      return;
    }

    const lockedSitesList = lockedSites || [];
    const sessionUnlockedSites = unlockedSites || {};
    const currentUrl = new URL(details.url);
    const currentHost = currentUrl.hostname;

    const isLocked = lockedSitesList.some((siteUrl) => {
      try {
        const lockedHost = new URL(siteUrl).hostname;
        return currentHost === lockedHost;
      } catch (e) {
        return false;
      }
    });

    if (isLocked) {
      const unlockEntry = sessionUnlockedSites[currentHost];
      const now = Date.now();
      const unlockDuration = 10000;

      if (unlockEntry && now - unlockEntry.timestamp < unlockDuration) {
        return;
      }

      if (unlockEntry) {
        delete sessionUnlockedSites[currentHost];
        await chrome.storage.session.set({ unlockedSites: sessionUnlockedSites });
      }

      try {
        await chrome.storage.local.set({ lastBlockedUrl: details.url });
        chrome.tabs.update(details.tabId, { url: chrome.runtime.getURL("src/pages/blocked.html") });
      } catch (error) {
        console.error("Error redirecting to blocked page:", error);
      }
    }
  } catch (error) {
    console.error("Error in webNavigation listener:", error);
  }
});