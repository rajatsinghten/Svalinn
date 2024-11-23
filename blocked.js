document.getElementById("unlockForm").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const enteredPassword = document.getElementById("unlockPassword").value;
  
    // Retrieve data from local storage
    const { masterPassword, lastBlockedUrl } = await chrome.storage.local.get([
      "masterPassword",
      "lastBlockedUrl"
    ]);
  
    if (!lastBlockedUrl) {
      document.getElementById("unlockStatus").textContent = "Error: Unable to retrieve the blocked URL.";
      return;
    }
  
    if (enteredPassword === masterPassword) {
      const currentHost = new URL(lastBlockedUrl).hostname;
  
      // Temporarily unlock the site
      const { unlockedSites } = await chrome.storage.session.get("unlockedSites");
      const sessionUnlockedSites = unlockedSites || {};
      sessionUnlockedSites[currentHost] = Date.now();
      await chrome.storage.session.set({ unlockedSites: sessionUnlockedSites });
  
      console.log(`Website unlocked: ${lastBlockedUrl}`);
      // Redirect directly to the blocked website
      window.location.href = lastBlockedUrl;
    } else {
      document.getElementById("unlockStatus").textContent = "Incorrect password!";
    }
  });
  