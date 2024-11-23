// Populate locked sites
function updateLockedSitesList() {
    chrome.runtime.sendMessage({ action: "GET_SITES" }, function (response) {
      const list = document.getElementById('lockedSitesList');
      list.innerHTML = '';
      response.sites.forEach(site => {
        const listItem = document.createElement('li');
        listItem.textContent = site;
        list.appendChild(listItem);
      });
    });
  }
  
  // Add a site to the locked list
  document.getElementById('addSiteButton').addEventListener('click', () => {
    const site = document.getElementById('siteInput').value;
    if (site) {
      chrome.runtime.sendMessage({ action: "ADD_SITE", site }, function () {
        updateLockedSitesList();
        document.getElementById('siteInput').value = ''; // Clear input
      });
    }
  });
  
  // Initialize list on popup load
  updateLockedSitesList();
  