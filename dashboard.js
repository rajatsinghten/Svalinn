document.addEventListener('DOMContentLoaded', () => {
    // Check if logged in
    chrome.storage.session.get(['isLoggedIn'], (result) => {
      if (!result.isLoggedIn) {
        window.location.href = 'login.html';
        return;
      }
      
      loadUserInfo();
      loadSites();
    });
  });
  
  function loadUserInfo() {
    chrome.storage.local.get(['userData'], (result) => {
      document.getElementById('userName').textContent = result.userData.name;
      document.getElementById('userDesignation').textContent = result.userData.designation;
    });
  }
  
  function loadSites() {
    chrome.storage.local.get(['lockedSites'], (result) => {
      const siteList = document.getElementById('siteList');
      siteList.innerHTML = '';
      
      result.lockedSites.forEach(site => {
        const div = document.createElement('div');
        div.className = 'site-item';
        div.innerHTML = `
          <span>${site}</span>
          <div>
            <button class="unlock-site" data-site="${site}">Unlock</button>
            <button class="remove-site" data-site="${site}">Remove</button>
          </div>
        `;
        siteList.appendChild(div);
      });
    });
  }
  
  document.getElementById('addSite').addEventListener('click', () => {
    const newSite = document.getElementById('newSite').value.trim();
    if (newSite) {
      chrome.storage.local.get(['lockedSites'], (result) => {
        const sites = result.lockedSites || [];
        sites.push(newSite);
        chrome.storage.local.set({ lockedSites: sites }, () => {
          document.getElementById('newSite').value = '';
          loadSites();
        });
      });
    }
  });
  
  document.getElementById('siteList').addEventListener('click', (e) => {
    const site = e.target.dataset.site;
    
    if (e.target.classList.contains('unlock-site')) {
      chrome.storage.session.get(['unlockedSites'], (result) => {
        const unlockedSites = result.unlockedSites || [];
        unlockedSites.push(site);
        chrome.storage.session.set({ unlockedSites });
      });
    }
    
    if (e.target.classList.contains('remove-site')) {
      chrome.storage.local.get(['lockedSites'], (result) => {
        const sites = result.lockedSites.filter(s => s !== site);
        chrome.storage.local.set({ lockedSites: sites }, loadSites);
      });
    }
  });
  
  document.getElementById('logout').addEventListener('click', () => {
    chrome.storage.session.clear(() => {
      window.location.href = 'login.html';
    });
  });
  