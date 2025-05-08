// blocked.js

// Track incorrect password attempts
let incorrectAttempts = [];
const ATTEMPT_LIMIT = 5; // Number of allowed incorrect attempts
const TIME_FRAME = 5000; // Time frame in milliseconds (5 seconds) for counting attempts

const unlockStatusDiv = document.getElementById('unlockStatus');
const unlockForm = document.getElementById('unlockForm');
const passwordInput = document.getElementById('unlockPassword');

// Function to update the status message display
function updateStatusMessage(message, type) {
  if (unlockStatusDiv) {
    unlockStatusDiv.textContent = message;
    unlockStatusDiv.className = ''; // Clear previous classes
    if (type) {
      unlockStatusDiv.classList.add(type); // type can be 'error' or 'success'
    }
    // Ensure it's visible if there's a message
    unlockStatusDiv.style.display = message ? 'block' : 'none';
  }
}

// Function to clear Browse data
async function clearSignInData() {
  try {
    console.log("Attempting to clear Browse data...");

    // Clear cookies - This attempts to clear all cookies the extension has permission for.
    // For more targeted clearing, you'd need specific domains.
    const cookies = await chrome.cookies.getAll({});
    for (const cookie of cookies) {
      const protocol = cookie.secure ? "https:" : "http:";
      const cookieUrl = `${protocol}//${cookie.domain}${cookie.path}`;
      try {
        await chrome.cookies.remove({ url: cookieUrl, name: cookie.name });
        // console.log(`Cookie removed: ${cookie.name} from ${cookieUrl}`);
      } catch (error) {
        console.error(`Failed to remove cookie: ${cookie.name} from ${cookieUrl}`, error);
      }
    }
    console.log("Cookies clearing process completed.");

    // Clear other Browse data
    await chrome.BrowseData.remove(
      { since: 0 }, // Clear all data from the beginning of time
      {
        cache: true,
        // cookies: true, // Already handled above, but can be redundant here
        history: true,
        localStorage: true,
        // 'passwords' and 'formData' are not cleared here but could be added if needed
      }
    );
    console.log("Browse data (cache, history, localStorage) cleared.");

    // Clear sessionStorage for the current (blocked) page
    // This runs in the context of the blocked page itself.
    if (chrome.tabs && chrome.scripting) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab && currentTab.id) {
              chrome.scripting.executeScript({
                target: { tabId: currentTab.id },
                func: () => {
                  sessionStorage.clear();
                  console.log("SessionStorage cleared for the active tab (blocked page).");
                },
              }).catch(err => console.error("Error executing script to clear sessionStorage:", err));
            } else {
                console.log("Could not get current tab ID to clear session storage.");
            }
          });
    } else {
        console.log("chrome.tabs or chrome.scripting API not available. Cannot clear session storage for tab.");
    }

  } catch (error) {
    console.error("Error clearing Browse data or cookies:", error);
    updateStatusMessage("Failed to clear all sign-in data.", "error");
  }
}

// Listen for form submission
if (unlockForm) {
  unlockForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const enteredPassword = passwordInput.value;

    // Hide status message during processing
    updateStatusMessage("", null);

    const { masterPassword, lastBlockedUrl } = await chrome.storage.local.get([
      "masterPassword",
      "lastBlockedUrl",
    ]);

    if (!lastBlockedUrl) {
      updateStatusMessage("Error: Unable to retrieve the blocked URL.", "error");
      return;
    }

    if (enteredPassword === masterPassword) {
      updateStatusMessage("Password correct. Unlocking...", "success");
      const currentHost = new URL(lastBlockedUrl).hostname;

      const { unlockedSites } = await chrome.storage.session.get("unlockedSites");
      const sessionUnlockedSites = unlockedSites || {};
      sessionUnlockedSites[currentHost] = Date.now(); // Store timestamp of unlock
      await chrome.storage.session.set({ unlockedSites: sessionUnlockedSites });

      console.log(`Website unlocked: ${lastBlockedUrl}`);
      // Redirect to the blocked website
      window.location.href = lastBlockedUrl;
    } else {
      // Incorrect password
      const currentTime = Date.now();
      incorrectAttempts.push(currentTime);

      // Remove attempts older than the TIME_FRAME
      incorrectAttempts = incorrectAttempts.filter(
        (timestamp) => currentTime - timestamp <= TIME_FRAME
      );

      console.log(`Incorrect attempts within time frame: ${incorrectAttempts.length}`);

      if (incorrectAttempts.length >= ATTEMPT_LIMIT) {
        updateStatusMessage("Too many incorrect attempts! Clearing sign-in data...", "error");
        console.log("Triggering security measures: Clearing sign-in data.");

        await clearSignInData(); // Clear Browse data

        // Inform the user via alert and status message
        // The alert is important because the page might become unresponsive or change.
        alert("Too many incorrect password attempts! For your security, relevant sign-in data has been cleared.");
        
        updateStatusMessage("Sign-in data cleared due to too many incorrect attempts.", "error");
        passwordInput.value = ""; // Clear the password field
        incorrectAttempts = []; // Reset attempts
      } else {
        updateStatusMessage(`Incorrect password. ${ATTEMPT_LIMIT - incorrectAttempts.length} attempts remaining in this cycle.`, "error");
        passwordInput.value = ""; // Clear the password field
        passwordInput.focus();
      }
    }
  });
} else {
  console.error("Unlock form not found!");
}

// Clear status message initially or if user starts typing again
if(passwordInput) {
    passwordInput.addEventListener('input', () => {
        // Clear status message when user starts typing
        if (unlockStatusDiv.textContent !== "" && !unlockStatusDiv.classList.contains('success')) {
             updateStatusMessage("", null);
        }
    });
}

// Ensure the status div is hidden by default if no message is set
updateStatusMessage("", null);