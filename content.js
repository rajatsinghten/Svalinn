function checkAndLockPage() {
  const currentUrl = window.location.href;
  
  chrome.storage.local.get(['lockedSites'], (result) => {
    const lockedSites = result.lockedSites || [];
    const isLocked = lockedSites.some(site => currentUrl.includes(site));
    
    if (isLocked) {
      chrome.storage.session.get(['unlockedSites'], (sessionResult) => {
        const unlockedSites = sessionResult.unlockedSites || [];
        const isUnlocked = unlockedSites.some(site => currentUrl.includes(site));
        
        if (!isUnlocked) {
          showOverlay();
        }
      });
    }
  });
}

chrome.runtime.sendMessage(
  { type: "checkSite", url: window.location.href },
  (response) => {
    if (response && response.isLocked) {
      createLockOverlay();
    }
  }
);

function createLockOverlay() {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  overlay.style.zIndex = "9999";
  overlay.style.color = "white";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";

  const message = document.createElement("h1");
  message.textContent = "This site is locked.";
  overlay.appendChild(message);

  const input = document.createElement("input");
  input.type = "password";
  input.placeholder = "Enter password";
  overlay.appendChild(input);

  const button = document.createElement("button");
  button.textContent = "Unlock";
  button.addEventListener("click", () => {
    const password = input.value;
    chrome.runtime.sendMessage(
      { type: "tempUnlockSite", url: window.location.href, password },
      (response) => {
        if (response.success) {
          overlay.remove();
        } else {
          alert("Incorrect password!");
        }
      }
    );
  });

  overlay.appendChild(button);
  document.body.appendChild(overlay);
}
