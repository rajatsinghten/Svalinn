document.getElementById("lockForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const website = document.getElementById("website").value;

  if (website) {
    const data = await chrome.storage.local.get("lockedSites");
    const lockedSites = data.lockedSites || [];

    // Add website to locked list
    if (!lockedSites.includes(website)) {
      lockedSites.push(website);
      await chrome.storage.local.set({ lockedSites });
      document.getElementById("status").textContent = "Website locked successfully!";
    } else {
      document.getElementById("status").textContent = "Website is already locked.";
    }

    document.getElementById("lockForm").reset();
  } else {
    alert("Please enter a valid website URL!");
  }
});
