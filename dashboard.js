document.addEventListener("DOMContentLoaded", async () => {
  const nameSpan = document.getElementById("user-name");
  const emailSpan = document.getElementById("user-email");

  const question1Label = document.getElementById("question1-label");
  const question2Label = document.getElementById("question2-label");

  const { userName, userEmail, securityQuestion1, securityQuestion2 } = await chrome.storage.local.get([
    "userName",
    "userEmail",
    "securityQuestion1",
    "securityQuestion2"
  ]);

  nameSpan.textContent = userName || "Not set";
  emailSpan.textContent = userEmail || "Not set";

  const questionMap = {
    pet: "What was the name of your first pet?",
    mother: "What is your mother's maiden name?",
    city: "In which city were you born?",
    car: "What was the make of your first car?",
    book: "What is your favorite book?",
    school: "What was the name of your first school?",
    street: "What was the name of the street you grew up on?",
    job: "What was the name of your first job?",
    food: "What is your favorite food?",
    movie: "What is your favorite movie?"
  };

  question1Label.textContent = questionMap[securityQuestion1] || "Security Question 1";
  question2Label.textContent = questionMap[securityQuestion2] || "Security Question 2";

  document.getElementById("change-password-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const oldPassword = document.getElementById("old-password").value;
  const newPassword = document.getElementById("new-password").value;

  const { masterPassword } = await chrome.storage.local.get("masterPassword");

  if (oldPassword === masterPassword) {
    chrome.runtime.sendMessage({ type: "setPassword", password: newPassword }, (response) => {
      if (response.status === "Password set successfully") {
        chrome.storage.local.set({ masterPassword: newPassword }, () => {
          alert("Master password changed successfully.");
          document.getElementById("old-password").value = "";
          document.getElementById("new-password").value = "";
        });
      } else {
        alert("Error updating password. Try again.");
      }
    });
  } else {
    alert("Incorrect current master password.");
  }
});


  // Recover master password
  document.getElementById("recovery-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const { securityAnswer1, securityAnswer2, masterPassword } = await chrome.storage.local.get([
      "securityAnswer1", "securityAnswer2", "masterPassword"
    ]);

    const entered1 = document.getElementById("answer1").value.trim();
    const entered2 = document.getElementById("answer2").value.trim();
    const result = document.getElementById("recovery-result");

    if (
      entered1.toLowerCase() === (securityAnswer1 || "").toLowerCase() &&
      entered2.toLowerCase() === (securityAnswer2 || "").toLowerCase()
    ) {
      result.textContent = `Recovered Master Password: ${masterPassword}`;
      result.style.color = "#28a745";
    } else {
      result.textContent = "Incorrect answers. Unable to recover password.";
      result.style.color = "#dc3545";
    }
  });
});
