document.getElementById('login').addEventListener('click', async () => {
    const masterPassword = document.getElementById('masterPassword').value;
    const hashedPassword = await hashPassword(masterPassword);
  
    chrome.storage.local.get(['userData'], async (result) => {
      if (result.userData.password === hashedPassword) {
        // Create session storage
        chrome.storage.session.set({
          isLoggedIn: true,
          unlockedSites: []
        }, () => {
          window.location.href = 'dashboard.html';
        });
      } else {
        alert('Incorrect password');
      }
    });
  });