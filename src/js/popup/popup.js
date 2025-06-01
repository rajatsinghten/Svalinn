document.addEventListener("DOMContentLoaded", async () => {
    const registeredView = document.getElementById("registered-view");
    const notRegisteredView = document.getElementById("not-registered-view");

    const { masterPassword } = await chrome.storage.local.get("masterPassword");

    if (!masterPassword) {
        notRegisteredView.style.display = "block";
        registeredView.style.display = "none";
        return; 
    }

    registeredView.style.display = "block";
    notRegisteredView.style.display = "none";


    const lockForm = document.getElementById("lockForm");
    const websiteInput = document.getElementById("website");
    const statusMessage = document.getElementById("status");
    const showLockedButton = document.getElementById("show-locked");
    const lockedSitesList = document.getElementById("locked-sites");
    const lockedSitesContainer = document.getElementById("locked-sites-list");


    lockForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const website = websiteInput.value.trim();

        if (website) {
            const normalizedUrl = new URL(website).origin; 
            const { lockedSites } = await chrome.storage.local.get("lockedSites");
            const lockedSitesList = lockedSites || [];

  
            if (!lockedSitesList.includes(normalizedUrl)) {
                lockedSitesList.push(normalizedUrl);
                await chrome.storage.local.set({ lockedSites: lockedSitesList });
                statusMessage.textContent = "Website locked successfully!";
            } else {
                statusMessage.textContent = "Website is already locked.";
            }

            websiteInput.value = ""; 
        } else {
            alert("Please enter a valid website URL!");
        }
    });

  
    showLockedButton.addEventListener("click", async () => {
        const { lockedSites } = await chrome.storage.local.get("lockedSites");
        const lockedSitesListData = lockedSites || [];

       
        lockedSitesList.innerHTML = "";

        if (lockedSitesListData.length > 0) {
          
            lockedSitesListData.forEach((site) => {
                const listItem = document.createElement("li");
                listItem.textContent = site;

              
                const removeButton = document.createElement("button");
                removeButton.textContent = "Remove";
                removeButton.style.marginLeft = "10px";
                removeButton.addEventListener("click", async () => {
                    const passwordInput = document.createElement("input");
                    passwordInput.type = "password";
                    passwordInput.placeholder = "Enter master password";
                    passwordInput.style.marginTop = "10px";
                    passwordInput.style.padding = "5px";
                    passwordInput.style.border = "1px solid #ccc";
                    passwordInput.style.borderRadius = "4px";

                    const confirmButton = document.createElement("button");
                    confirmButton.textContent = "Confirm";
                    confirmButton.style.marginLeft = "10px";
                    confirmButton.style.padding = "5px 10px";
                    confirmButton.style.border = "none";
                    confirmButton.style.borderRadius = "4px";
                    confirmButton.style.backgroundColor = "#007bff";
                    confirmButton.style.color = "white";
                    confirmButton.style.cursor = "pointer";

                    const passwordContainer = document.createElement("div");
                    passwordContainer.style.marginTop = "10px";
                    passwordContainer.appendChild(passwordInput);
                    passwordContainer.appendChild(confirmButton);

                    listItem.appendChild(passwordContainer);

                    confirmButton.addEventListener("click", async () => {
                        const enteredPassword = passwordInput.value;

                        const { masterPassword } = await chrome.storage.local.get("masterPassword");
                        if (enteredPassword === masterPassword) {
                            const updatedLockedSites = lockedSitesListData.filter((lockedSite) => lockedSite !== site);
                            await chrome.storage.local.set({ lockedSites: updatedLockedSites });

                            alert("Website removed successfully!");
                            showLockedButton.click();
                        } else {
                            alert("Incorrect master password. Unable to remove the website.");
                        }


                        passwordContainer.remove();
                    });
                });

                listItem.appendChild(removeButton);
                lockedSitesList.appendChild(listItem);
            });

            
            lockedSitesContainer.style.display = "block";
        } else {
            alert("No locked websites found.");
        }
    });
});
