document.getElementById('register').addEventListener('click', async () => {
    const name = document.getElementById('name').value;
    const designation = document.getElementById('designation').value;
    const masterPassword = document.getElementById('masterPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
  
    if (!name || !designation || !masterPassword) {
      alert('Please fill in all fields');
      return;
    }
  
    if (masterPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
  
    const hashedPassword = await hashPassword(masterPassword);
    
    const userData = {
      name,
      designation,
      password: hashedPassword,
      isRegistered: true
    };
  
    chrome.storage.local.set({
      userData,
      lockedSites: [],
      unlockedSites: []
    }, () => {
      window.location.href = 'login.html';
    });
  });