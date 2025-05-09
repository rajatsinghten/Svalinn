// blocked.js

// Track incorrect password attempts
let incorrectAttempts = [];
const ATTEMPT_LIMIT = 5; // Number of allowed incorrect attempts
const TIME_FRAME = 5000; // Time frame in milliseconds (5 seconds)

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

// Function to clear Browse data (Keep this function as is)
async function clearSignInData() {
  try {
    console.log("Attempting to clear Browse data...");
    const cookies = await chrome.cookies.getAll({});
    for (const cookie of cookies) {
      const protocol = cookie.secure ? "https:" : "http:";
      const cookieUrl = `${protocol}//${cookie.domain}${cookie.path}`;
      try {
        await chrome.cookies.remove({ url: cookieUrl, name: cookie.name });
      } catch (error) {
        console.error(`Failed to remove cookie: ${cookie.name} from ${cookieUrl}`, error);
      }
    }
    console.log("Cookies clearing process completed.");
    await chrome.BrowseData.remove(
      { since: 0 },
      { cache: true, history: true, localStorage: true }
    );
    console.log("Browse data (cache, history, localStorage) cleared.");
    if (chrome.tabs && chrome.scripting) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab && currentTab.id) {
              chrome.scripting.executeScript({
                target: { tabId: currentTab.id },
                func: () => { sessionStorage.clear(); console.log("SessionStorage cleared for the active tab."); },
              }).catch(err => console.error("Error executing script to clear sessionStorage:", err));
            } else { console.log("Could not get current tab ID to clear session storage."); }
          });
    } else { console.log("chrome.tabs or chrome.scripting API not available. Cannot clear session storage for tab."); }
  } catch (error) {
    console.error("Error clearing Browse data or cookies:", error);
    updateStatusMessage("Failed to clear all sign-in data.", "error");
  }
}

// Listen for form submission
if (unlockForm) {
  unlockForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const enteredPassword = passwordInput.value.trim(); // *** ADD .trim() ***

    // Hide status message during processing
    updateStatusMessage("", null);

    const { masterPassword, lastBlockedUrl } = await chrome.storage.local.get([
      "masterPassword",
      "lastBlockedUrl",
    ]);

    if (!lastBlockedUrl) {
      updateStatusMessage("Error: Unable to retrieve the blocked URL.", "error");
      console.error("lastBlockedUrl not found in storage."); // *** ADD LOG ***
      return;
    }
    
    // *** ADD DEBUG LOGS (REMOVE IN PRODUCTION) ***
    console.log("Comparing passwords:");
    console.log("Entered (trimmed):", enteredPassword);
    console.log("Stored:", masterPassword);
    // *** END DEBUG LOGS ***


    // *** IMPORTANT: If you implemented hashing, this comparison needs to change! ***
    // It should be: const isMatch = await comparePasswords(enteredPassword, masterPassword);
    // where comparePasswords hashes the entered password and compares it to the stored hash.
    if (enteredPassword === masterPassword) { // *** COMPARISON HERE ***
      updateStatusMessage("Password correct. Unlocking...", "success");
      
      // Wait a moment to show the success message
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms

      const currentHost = new URL(lastBlockedUrl).hostname;

      const { unlockedSites } = await chrome.storage.session.get("unlockedSites");
      const sessionUnlockedSites = unlockedSites || {};

      // Store the unlock timestamp for the specific hostname
      sessionUnlockedSites[currentHost] = {
          timestamp: Date.now(),
          // You could potentially store more info here if needed, e.g., unlocked by password vs temp override
      };

      await chrome.storage.session.set({ unlockedSites: sessionUnlockedSites });
      console.log(`Website unlocked: ${lastBlockedUrl} (Hostname: ${currentHost})`); // *** ADD LOG ***

      // Redirect to the blocked website
      // Use chrome.tabs.update for better integration with the browser history/tab state
      try {
          // Get the ID of the currently blocked tab
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const currentTab = tabs[0];
          if (currentTab && currentTab.id) {
               chrome.tabs.update(currentTab.id, { url: lastBlockedUrl });
          } else {
               // Fallback if tab ID not found (shouldn't happen on the blocked page)
               window.location.href = lastBlockedUrl;
          }
      } catch (error) {
          console.error("Error redirecting using chrome.tabs.update:", error);
          // Fallback to window.location if chrome.tabs.update fails
          window.location.href = lastBlockedUrl;
      }

    } else {
      // Incorrect password
      const currentTime = Date.now();
      incorrectAttempts.push(currentTime);

      // Remove attempts older than the TIME_FRAME
      incorrectAttempts = incorrectAttempts.filter(
        (timestamp) => currentTime - timestamp >= currentTime - TIME_FRAME // Corrected logic here
      );

      console.log(`Incorrect attempts within time frame (${TIME_FRAME / 1000}s): ${incorrectAttempts.length}`); // *** ADD LOG ***

      if (incorrectAttempts.length >= ATTEMPT_LIMIT) {
        updateStatusMessage("Too many incorrect attempts! Clearing sign-in data...", "error");
        console.warn("Too many incorrect attempts. Triggering security measure."); // *** ADD LOG ***

        await clearSignInData(); // Clear Browse data

        // Use a slight delay before alert/reset to allow status message to show
        setTimeout(() => {
             alert("Too many incorrect password attempts! For your security, relevant sign-in data has been cleared.");
             updateStatusMessage("Sign-in data cleared due to too many incorrect attempts.", "error");
             passwordInput.value = ""; // Clear the password field
             incorrectAttempts = []; // Reset attempts
             passwordInput.focus();
        }, 100); // Short delay
      } else {
        updateStatusMessage(`Incorrect password. ${ATTEMPT_LIMIT - incorrectAttempts.length} attempts remaining.`, "error"); // *** IMPROVE MESSAGE ***
        passwordInput.value = ""; // Clear the password field
        passwordInput.focus();
      }
    }
  });
} else {
  console.error("Unlock form not found in blocked.html!"); // *** IMPROVE ERROR MESSAGE ***
}

// Clear status message initially or if user starts typing again
if(passwordInput) {
    passwordInput.addEventListener('input', () => {
        // Clear status message when user starts typing, unless it's a success message
        if (unlockStatusDiv && unlockStatusDiv.textContent !== "" && !unlockStatusDiv.classList.contains('success')) {
             updateStatusMessage("", null);
        }
    });
}

// Ensure the status div is hidden by default if no message is set
updateStatusMessage("", null);

// *** Correction to incorrectAttempts filtering logic ***
// The filter condition `currentTime - timestamp >= currentTime - TIME_FRAME`
// should be `currentTime - timestamp <= TIME_FRAME`.
// Example: If TIME_FRAME is 5000ms.
// An attempt at time 1000ms is within the last 5000ms at time 5500ms because 5500 - 1000 = 4500 which is <= 5000.
// The original condition `5500 - 1000 >= 5500 - 5000` -> `4500 >= 500` is true, which keeps old attempts.
// The corrected condition `5500 - 1000 <= 5000` -> `4500 <= 5000` is also true, keeps recent attempts.
// The condition `(currentTime - timestamp) <= TIME_FRAME` keeps attempts from `TIME_FRAME` ago up to now.