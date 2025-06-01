document.getElementById("agree-button").addEventListener("click", function() {
    chrome.tabs.create({ url: chrome.runtime.getURL("src/pages/registration.html") });
    window.close();
});