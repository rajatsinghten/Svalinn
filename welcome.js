document.getElementById("agree-button").addEventListener("click", function() {
    // Assuming registration.html is in the same directory
    // You might need to adjust the path if your files are organized differently
    chrome.tabs.create({ url: chrome.runtime.getURL("registration.html") });
    // Close the welcome tab
    window.close();
});