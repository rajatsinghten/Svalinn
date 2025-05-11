// background.js

// Open the welcome page upon installation IF the user is not already registered
chrome.runtime.onInstalled.addListener(() => {
  // Check if the 'isRegistered' flag exists in the local storage
  chrome.storage.local.get('isRegistered', (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error checking registration status:", chrome.runtime.lastError);
      // In case of error, assume not registered and proceed to welcome
      openWelcomePage();
      return;
    }

    // If the user is NOT registered (flag is false or doesn't exist)
    if (!data.isRegistered) {
      console.log("User not registered, opening welcome page.");
      openWelcomePage();
    } else {
      console.log("User already registered.");
      // User is registered, do nothing on install - the popup handles subsequent interactions
    }
  });
});

// Helper function to open the welcome page
function openWelcomePage() {
    // Use chrome.runtime.getURL to get the full path to the HTML file
    const welcomePageUrl = chrome.runtime.getURL("welcome.html");
    chrome.tabs.create({ url: welcomePageUrl });
}


// Handle messages from other parts of the extension (like registration.js)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "setPassword") {
    // *** SECURITY WARNING: STORING PLAIN TEXT PASSWORDS IS DANGEROUS! ***
    // You MUST securely hash the master password before storing it.
    // Use a strong, slow hashing algorithm like Argon2, scrypt, or bcrypt.
    // Do NOT store the plain text password or use simple hashing like MD5/SHA-256 without salts and iterations.
    // Implementing secure hashing requires a dedicated library or function.

    console.warn("SECURITY ALERT: Storing master password in plain text. Implement hashing!");

    // Example of where you would hash (you need to implement hashPassword function)
    // const hashedPassword = await hashPassword(request.password);

    // For demonstration purposes only (STILL INSECURE): saving plain text
    chrome.storage.local.set({ masterPassword: request.password /* REPLACE with hashedPassword */ }, () => {
      if (chrome.runtime.lastError) {
          console.error("Error saving master password:", chrome.runtime.lastError);
          sendResponse({ status: "Error saving password" });
      } else {
          console.log("Master password saved (INSECURELY):", request.password); // Log hashed password in real app
          sendResponse({ status: "Password set successfully" });
      }
    });

    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  }

  // Add other message handlers here if needed
});

// Handle navigation and site locking logic
// This part of your original script is related to the core locking feature
// and can remain, assuming it functions correctly with the stored data.
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Prevent running on extension pages or non-http/https pages
  if (details.url.startsWith(chrome.runtime.getURL("")) || !details.url.startsWith("http")) {
      return;
  }

  try {
      const { lockedSites, isRegistered } = await chrome.storage.local.get(["lockedSites", "isRegistered"]);
      const { unlockedSites } = await chrome.storage.session.get("unlockedSites");

      // If the user is not registered, do not apply locking logic
      if (!isRegistered) {
          return;
      }

      const lockedSitesList = lockedSites || [];
      const sessionUnlockedSites = unlockedSites || {};
      const currentUrl = new URL(details.url);
      const currentHost = currentUrl.hostname;

      // Check if the site is in the locked list by hostname
      const isLocked = lockedSitesList.some((siteUrl) => {
          try {
              const lockedHost = new URL(siteUrl).hostname;
              // Compare hostnames. You might need more sophisticated matching
              // depending on how you want locking to work (e.g., subdomains)
              return currentHost === lockedHost;
          } catch (e) {
              console.error("Invalid URL in lockedSites:", siteUrl, e);
              return false; // Ignore invalid URLs in the list
          }
      });


      if (isLocked) {
          // Check if the site is temporarily unlocked in the current session
          const unlockEntry = sessionUnlockedSites[currentHost];
          const now = Date.now();
          const unlockDuration = 10000; // 10 seconds unlock duration from your original code

          if (unlockEntry && now - unlockEntry.timestamp < unlockDuration) {
            // Check if the password attempt for this unlock was successful (if you track that)
            // For now, just check timestamp as per original logic
            console.log(`Access allowed (temporarily unlocked) for: ${currentHost}`);
            return; // Allow navigation
          }

          // If locked or unlock expired, remove expired unlock entry and redirect
          if (unlockEntry) {
            console.log(`Temporary unlock expired for: ${currentHost}`);
            delete sessionUnlockedSites[currentHost];
            await chrome.storage.session.set({ unlockedSites: sessionUnlockedSites });
          }

          // Redirect to the blocked page
          console.log(`Site locked: ${currentHost}. Redirecting.`);
          try {
            // Save the current URL before redirecting
            await chrome.storage.local.set({ lastBlockedUrl: details.url });
            // Redirect the current tab
            chrome.tabs.update(details.tabId, { url: chrome.runtime.getURL("blocked.html") });
          } catch (error) {
            console.error("Error redirecting to blocked page:", error);
            // Fallback: If update fails, maybe open in a new tab (less ideal for UX)
            // chrome.tabs.create({ url: chrome.runtime.getURL("blocked.html") });
          }
      }
  } catch (error) {
      console.error("Error in webNavigation listener:", error);
  }
});