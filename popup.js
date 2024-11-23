document.addEventListener("DOMContentLoaded", () => {
    const lockForm = document.getElementById("lockForm");
    const websiteInput = document.getElementById("website");
    const statusMessage = document.getElementById("status");
    const showLockedButton = document.getElementById("show-locked");
    const lockedSitesList = document.getElementById("locked-sites");
    const lockedSitesContainer = document.getElementById("locked-sites-list");
  
    // Handle form submission to lock a new website
    lockForm.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const website = websiteInput.value.trim();
  
      if (website) {
        const normalizedUrl = new URL(website).origin; // Normalize to the origin (e.g., https://example.com)
        const { lockedSites } = await chrome.storage.local.get("lockedSites");
        const lockedSitesList = lockedSites || [];
  
        // Add the website to the locked list if it's not already there
        if (!lockedSitesList.includes(normalizedUrl)) {
          lockedSitesList.push(normalizedUrl);
          await chrome.storage.local.set({ lockedSites: lockedSitesList });
          statusMessage.textContent = "Website locked successfully!";
        } else {
          statusMessage.textContent = "Website is already locked.";
        }
  
        websiteInput.value = ""; // Clear the input field
      } else {
        alert("Please enter a valid website URL!");
      }
    });
  
    // Handle button click to show locked websites
    showLockedButton.addEventListener("click", async () => {
      const { lockedSites } = await chrome.storage.local.get("lockedSites");
      const lockedSitesListData = lockedSites || [];
  
      // Clear the existing list
      lockedSitesList.innerHTML = "";
  
      if (lockedSitesListData.length > 0) {
        // Populate the list with locked websites
        lockedSitesListData.forEach((site) => {
          const listItem = document.createElement("li");
          listItem.textContent = site;
  
          // Add a remove button for each site
          const removeButton = document.createElement("button");
          removeButton.textContent = "Remove";
          removeButton.style.marginLeft = "10px";
          removeButton.addEventListener("click", async () => {
            // Prompt for the master password before removal
            const { masterPassword } = await chrome.storage.local.get("masterPassword");
            const enteredPassword = prompt("Enter the master password to remove this website:");
  
            if (enteredPassword === masterPassword) {
              // Remove the website from the locked list
              const updatedLockedSites = lockedSitesListData.filter((lockedSite) => lockedSite !== site);
              await chrome.storage.local.set({ lockedSites: updatedLockedSites });
  
              alert("Website removed successfully!");
              showLockedButton.click(); // Refresh the list
            } else {
              alert("Incorrect master password. Unable to remove the website.");
            }
          });
  
          listItem.appendChild(removeButton);
          lockedSitesList.appendChild(listItem);
        });
  
        // Show the container
        lockedSitesContainer.style.display = "block";
      } else {
        alert("No locked websites found.");
      }
    });
  });
  