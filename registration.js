document.getElementById("registration-form").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent the form from reloading the page

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value; // Changed from designation
    const masterPassword = document.getElementById("master-password").value;
    const securityQuestion1 = document.getElementById("security-question1").value;
    const securityAnswer1 = document.getElementById("security-answer1").value;
    const securityQuestion2 = document.getElementById("security-question2").value;
    const securityAnswer2 = document.getElementById("security-answer2").value;

    // *** SECURITY WARNING ***
    // Storing security answers directly in chrome.storage.local is INSECURE for
    // recovering a master password that encrypts sensitive data.
    // Anyone with access to the browser profile could potentially retrieve them.
    // A real-world secure recovery system for a master password typically involves:
    // 1. Warning the user losing the password loses data.
    // 2. Offering a downloadable recovery code (an encrypted key backup).
    // 3. Using a server-side system (more complex for an extension).
    // This implementation saves the Q&A as requested, but should not be relied upon
    // for secure master password recovery. It's more suitable for remembering
    // a username or recovering less sensitive settings.
    // **********************

    // First, attempt to save the master password via background script
    chrome.runtime.sendMessage(
      { type: "setPassword", password: masterPassword },
      (response) => {
        if (response.status === "Password set successfully") {
          // If password saves, then save other registration details locally
          chrome.storage.local.set(
            {
              userName: name,
              userEmail: email, // Changed from userDesignation
              securityQuestion1: securityQuestion1,
              securityAnswer1: securityAnswer1,
              securityQuestion2: securityQuestion2,
              securityAnswer2: securityAnswer2,
              isRegistered: true // Add a flag indicating successful registration
            },
            () => {
               // Check for runtime errors
               if (chrome.runtime.lastError) {
                   console.error("Error saving registration data:", chrome.runtime.lastError);
                   alert("Registration successful, but there was an error saving some details.");
               } else {
                   alert("Registration successful!");
               }
               window.close(); // Close the tab after saving
            }
          );
        } else {
          // Handle potential error from background script
          alert("Error saving the master password. Please try again.");
        }
      }
    );
});