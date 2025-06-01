document.getElementById("registration-form").addEventListener("submit", function(event) {
    event.preventDefault(); 

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value; // Changed from designation
    const masterPassword = document.getElementById("master-password").value;
    const securityQuestion1 = document.getElementById("security-question1").value;
    const securityAnswer1 = document.getElementById("security-answer1").value;
    const securityQuestion2 = document.getElementById("security-question2").value;
    const securityAnswer2 = document.getElementById("security-answer2").value;

    
    chrome.runtime.sendMessage(
      { type: "setPassword", password: masterPassword },
      (response) => {
        if (response.status === "Password set successfully") {
         
          chrome.storage.local.set(
            {
              userName: name,
              userEmail: email, 
              securityQuestion1: securityQuestion1,
              securityAnswer1: securityAnswer1,
              securityQuestion2: securityQuestion2,
              securityAnswer2: securityAnswer2,
              isRegistered: true 
            },
            () => {
               
               if (chrome.runtime.lastError) {
                   console.error("Error saving registration data:", chrome.runtime.lastError);
                   alert("Registration successful, but there was an error saving some details.");
               } else {
                   alert("Registration successful!");
               }
               window.close(); 
            }
          );
        } else {
          
          alert("Error saving the master password. Please try again.");
        }
      }
    );
});