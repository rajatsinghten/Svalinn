// Send a message to check if the current site is locked
chrome.runtime.sendMessage(
    { action: "CHECK_SITE", url: window.location.href },
    function (response) {
      if (response.isLocked) {
        // Create an overlay if the site is locked
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        overlay.style.color = 'white';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';
        overlay.innerHTML = `
          <h1>Access Restricted</h1>
          <p>This website is locked. Enter the password to unlock.</p>
          <input type="password" id="unlockPassword" placeholder="Enter password" />
          <button id="unlockButton">Unlock</button>
        `;
        document.body.appendChild(overlay);
  
        // Handle unlock button click
        document.getElementById('unlockButton').addEventListener('click', () => {
          const password = document.getElementById('unlockPassword').value;
          chrome.runtime.sendMessage(
            { action: "CHECK_PASSWORD", password },
            function (response) {
              if (response.isCorrect) {
                overlay.remove(); // Remove overlay if password is correct
              } else {
                alert("Incorrect password!");
              }
            }
          );
        });
      }
    }
  );
  