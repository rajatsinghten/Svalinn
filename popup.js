// Lock a website
document.getElementById("lock-site").addEventListener("click", () => {
    const url = document.getElementById("url").value.trim();
    if (!url || !url.startsWith("http")) {
      alert("Please enter a valid URL (e.g., https://example.com).");
      return;
    }
  
    chrome.runtime.sendMessage({ type: "lockSite", url }, (response) => {
      alert(response.status);
    });
  });
  