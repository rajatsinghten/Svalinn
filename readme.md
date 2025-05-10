# For SecureXHackathon

## Svalinn: Website Locker Extension

Svalinn is a browser extension designed to help users secure their Browse by allowing them to lock access to specific websites with a master password.

## Features

* **Master Password Protection:** Secure your locked websites with a unique master password.
* **Website Locking:** Easily add website URLs to a locked list via the extension popup.
* **Temporary Unlocking:** Access locked sites by entering the correct master password on a dedicated blocked page. Temporary unlock duration prevents immediate re-locking (currently 10 seconds in the provided background script logic).
* **Incorrect Attempt Security:** Clears Browse data (cookies, cache, history, local storage, session storage) after multiple incorrect password attempts on the blocked page.
* **User Registration Flow:** Guides new users through a registration process to set up their master password and account details (name, email).
* **Security Questions:** Includes fields for security questions during registration for potential future recovery mechanisms (see Security Note).
* **Account Management Page:** Provides a dedicated page to view account information and reset the master password.
* **Responsive Popup UI:** The extension popup has a user-friendly interface that adapts to different sizes.

## Installation

To install and run Svalinn:

1.  Download or clone the extension files.
2.  Open your browser (Chrome, Edge, Brave, etc.).
3.  Navigate to the extensions management page:
    * Chrome/Edge/Brave: Go to `chrome://extensions` or `edge://extensions`.
    * Firefox: Go to `about:addons`, then click the gear icon and select "Debug Add-ons".
4.  Enable "Developer mode" (usually a toggle switch in the top right).
5.  Click the "Load unpacked" or "Load Temporary Add-on" button.
6.  Select the directory containing your extension files (`manifest.json`, `popup.html`, `background.js`, etc.).
7.  The extension should now be installed and appear in your browser's toolbar.

## Usage

1.  **First Time Use:**
    * Upon installation, a welcome page (`welcome.html`) will open in a new tab.
    * Read the information and click "Agree and Register".
    * You will be redirected to the registration page (`registration.html`).
    * Fill in your Name, Email, Master Password, and Security Questions/Answers.
    * Click "Register". The registration page will close, and your master password and details will be saved.
2.  **Locking Websites:**
    * Click the Svalinn extension icon in your browser toolbar to open the popup (`popup.html`).
    * If registered, you will see the main UI.
    * Enter the URL of the website you want to lock in the input field.
    * Click "Lock Website". The website will be added to your locked list (URLs are normalized to their origin, e.g., `https://example.com`).
3.  **Viewing/Removing Locked Websites:**
    * Open the extension popup.
    * Click "Show Locked Websites".
    * A list of currently locked origins will appear.
    * Click the "Remove" button next to a locked site. You will be prompted to enter your master password to confirm the removal.
4.  **Accessing Locked Websites:**
    * Navigate to a website you have locked.
    * You will be redirected to the blocked page (`blocked.html`).
    * Enter your master password on this page.
    * If the password is correct, you will be redirected to the original website for a limited time (currently 10 seconds before the lock is re-applied on next navigation).
5.  **Account Settings:**
    * Open the extension popup (when registered).
    * Click the account icon (usually in the heading area).
    * This will open the Account Settings page (`account.html`) in a new tab.
    * Here you can view your registered name/email and reset your master password.

## Security Note


Storing security answers in `chrome.storage.local` is **not secure for master password recovery** as they are not protected if the master password is lost. A secure recovery mechanism for a master password in a client-side extension is highly complex and often involves the user securely storing a separate recovery key or code provided during registration.

## Technologies Used

* HTML5
* CSS3 (including Flexbox, Gradients, @import for Google Fonts)
* JavaScript (ES6+)
* Web Extension APIs (chrome.storage.local, chrome.storage.session, chrome.runtime, chrome.tabs, chrome.webNavigation, chrome.BrowseData, chrome.cookies, chrome.scripting)