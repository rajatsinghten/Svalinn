let isOverlayActive = false;

function createOverlay() {
  console.log('Creating overlay...');  // Debug log
  const overlay = document.createElement('div');
  overlay.className = 'password-overlay';
  
  const container = document.createElement('div');
  container.className = 'password-container';
  
  const heading = document.createElement('h2');
  heading.textContent = 'This website is locked';
  
  const input = document.createElement('input');
  input.type = 'password';
  input.className = 'password-input';
  input.placeholder = 'Enter password';
  
  const button = document.createElement('button');
  button.className = 'submit-button';
  button.textContent = 'Unlock';
  
  const errorMessage = document.createElement('div');
  errorMessage.className = 'error-message';
  errorMessage.textContent = 'Incorrect password';
  
  button.addEventListener('click', () => {
    chrome.runtime.sendMessage(
      { action: "CHECK_PASSWORD", password: input.value },
      function(response) {
        if (response.isCorrect) {
          overlay.remove();
          isOverlayActive = false;
        } else {
          errorMessage.style.display = 'block';
          input.value = '';
        }
      }
    );
  });
  
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      button.click();
    }
  });
  
  container.appendChild(heading);
  container.appendChild(input);
  container.appendChild(button);
  container.appendChild(errorMessage);
  overlay.appendChild(container);
  
  return overlay;
}

function checkAndLockPage() {
  console.log('Checking page...'); // Debug log
  if (isOverlayActive) return;

  const currentUrl = window.location.href;
  console.log('Current URL:', currentUrl); // Debug log
  
  chrome.runtime.sendMessage(
    { action: "CHECK_SITE", url: currentUrl },
    function(response) {
      console.log('Check site response:', response); // Debug log
      if (response && response.isLocked && !isOverlayActive) {
        console.log('Site is locked, showing overlay'); // Debug log
        const overlay = createOverlay();
        if (document.body) {
          document.body.appendChild(overlay);
          isOverlayActive = true;
        } else {
          // If body isn't ready, wait for it
          document.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(overlay);
            isOverlayActive = true;
          });
        }
      }
    }
  );
}

// Initial check
checkAndLockPage();

// Recheck when URL changes
let lastUrl = window.location.href;
new MutationObserver(() => {
  if (lastUrl !== window.location.href) {
    lastUrl = window.location.href;
    checkAndLockPage();
  }
}).observe(document, { subtree: true, childList: true });

// Also check when page loads completely
window.addEventListener('load', checkAndLockPage);
