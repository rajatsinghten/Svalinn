chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['userData'], (result) => {
    if (!result.userData || !result.userData.isRegistered) {
      chrome.browserAction.setPopup({ popup: 'registration.html' });
    } else {
      chrome.browserAction.setPopup({ popup: 'login.html' });
    }
  });
});
