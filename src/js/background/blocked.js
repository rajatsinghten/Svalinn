
let incorrectAttempts = [];
const ATTEMPT_LIMIT = 5;
const TIME_FRAME = 1000;

const unlockStatusDiv = document.getElementById('unlockStatus');
const unlockForm = document.getElementById('unlockForm');
const passwordInput = document.getElementById('unlockPassword');

function updateStatusMessage(message, type) {
  if (unlockStatusDiv) {
    unlockStatusDiv.textContent = message;
    unlockStatusDiv.className = '';
    if (type) {
      unlockStatusDiv.classList.add(type);
    }
    unlockStatusDiv.style.display = message ? 'block' : 'none';
  }
}

async function clearSignInData() {
  try {
    const cookies = await chrome.cookies.getAll({});
    for (const cookie of cookies) {
      const protocol = cookie.secure ? "https:" : "http:";
      const cookieUrl = `${protocol}//${cookie.domain}${cookie.path}`;
      try {
        await chrome.cookies.remove({ url: cookieUrl, name: cookie.name });
      } catch (error) {
        console.error(`Failed to remove cookie: ${cookie.name}`, error);
      }
    }
    await chrome.browsingData.remove(
      { since: 0 },
      { cache: true, history: true, localStorage: true }
    );
    if (chrome.tabs && chrome.scripting) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (currentTab && currentTab.id) {
          chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: () => { sessionStorage.clear(); },
          }).catch(err => console.error("Error clearing sessionStorage:", err));
        }
      });
    }
  } catch (error) {
    console.error("Error clearing data:", error);
    updateStatusMessage("Failed to clear sign-in data.", "error");
  }
}

if (unlockForm) {
  unlockForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const enteredPassword = passwordInput.value.trim();
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
      await new Promise(resolve => setTimeout(resolve, 500));

      const currentHost = new URL(lastBlockedUrl).hostname;
      const { unlockedSites } = await chrome.storage.session.get("unlockedSites");
      const sessionUnlockedSites = unlockedSites || {};

      sessionUnlockedSites[currentHost] = {
        timestamp: Date.now(),
      };

      await chrome.storage.session.set({ unlockedSites: sessionUnlockedSites });

      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        if (currentTab && currentTab.id) {
          chrome.tabs.update(currentTab.id, { url: lastBlockedUrl });
        } else {
          window.location.href = lastBlockedUrl;
        }
      } catch (error) {
        window.location.href = lastBlockedUrl;
      }
    } else {
      const currentTime = Date.now();
      incorrectAttempts.push(currentTime);
      incorrectAttempts = incorrectAttempts.filter(
        (timestamp) => currentTime - timestamp <= TIME_FRAME
      );

      if (incorrectAttempts.length >= ATTEMPT_LIMIT) {
        updateStatusMessage("Too many incorrect attempts! Clearing sign-in data...", "error");
        await clearSignInData();
        setTimeout(() => {
          alert("Too many incorrect password attempts! For your security, relevant sign-in data has been cleared.");
          updateStatusMessage("Sign-in data cleared due to too many incorrect attempts.", "error");
          passwordInput.value = "";
          incorrectAttempts = [];
          passwordInput.focus();
        }, 100);
      } else {
        updateStatusMessage(`Incorrect password. ${ATTEMPT_LIMIT - incorrectAttempts.length} attempts remaining.`, "error");
        passwordInput.value = "";
        passwordInput.focus();
      }
    }
  });
}

if (passwordInput) {
  passwordInput.addEventListener('input', () => {
    if (unlockStatusDiv && unlockStatusDiv.textContent !== "" && !unlockStatusDiv.classList.contains('success')) {
      updateStatusMessage("", null);
    }
  });
}

updateStatusMessage("", null);