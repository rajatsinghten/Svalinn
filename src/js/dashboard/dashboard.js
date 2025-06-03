document.addEventListener("DOMContentLoaded", async () => {
  const nameSpan = document.getElementById("user-name");
  const emailSpan = document.getElementById("user-email");
  const question1Label = document.getElementById("question1-label");
  const question2Label = document.getElementById("question2-label");

  // Load user data
  const { userName, userEmail, securityQuestion1, securityQuestion2 } = await chrome.storage.local.get([
    "userName",
    "userEmail",
    "securityQuestion1",
    "securityQuestion2"
  ]);

  nameSpan.textContent = userName || "User";
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
  console.log('Dashboard initialized, loading locked websites...');
  
  // Load locked websites with error handling
  try {
    await loadLockedWebsites();
  } catch (error) {
    console.error('Error loading locked websites:', error);
  }

  // Initialize password management features
  initializePasswordManagement();

  // Change password form handler
  document.getElementById("change-password-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const oldPassword = document.getElementById("old-password").value;
    const newPassword = document.getElementById("new-password").value;

    const { masterPassword } = await chrome.storage.local.get("masterPassword");

    if (oldPassword === masterPassword) {
      chrome.runtime.sendMessage({ type: "setPassword", password: newPassword }, (response) => {
        if (response.status === "Password set successfully") {          chrome.storage.local.set({ masterPassword: newPassword }, () => {
            showNotification("Master password changed successfully.", "success");
            document.getElementById("old-password").value = "";
            document.getElementById("new-password").value = "";
          });
        } else {
          showNotification("Error updating password. Try again.", "error");
        }
      });
    } else {
      showNotification("Incorrect current master password.", "error");
    }
  });

  // Recovery form handler
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
      entered2.toLowerCase() === (securityAnswer2 || "").toLowerCase()    ) {
      result.textContent = `Your Master Password: ${masterPassword}`;
      result.className = "recovery-result success";
    } else {
      result.textContent = "Incorrect answers. Unable to recover password.";
      result.className = "recovery-result error";
    }  });

  function updateQuestionLabels(question1, question2) {
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

    document.getElementById("question1-label").textContent = questionMap[question1] || "Security Question 1";
    document.getElementById("question2-label").textContent = questionMap[question2] || "Security Question 2";
  }
  function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      ${type === 'success' ? 'background: #28a745;' : 'background: #dc3545;'}
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
  
  async function loadLockedWebsites() {
    try {
      console.log('Starting loadLockedWebsites function...');
      
      const { lockedSites } = await chrome.storage.local.get("lockedSites");
      const lockedWebsitesList = document.getElementById("locked-websites-list");
      
      console.log('Loading locked websites:', lockedSites);
      console.log('Element found:', lockedWebsitesList);
      console.log('Type of lockedSites:', typeof lockedSites);
      console.log('Is array:', Array.isArray(lockedSites));
      
      if (!lockedWebsitesList) {
        console.error('Could not find locked-websites-list element!');
        return;
      }
        if (!lockedSites || lockedSites.length === 0) {
        console.log('No locked sites found or array is empty');
        lockedWebsitesList.innerHTML = '<li class="no-websites">No websites locked yet</li>';
        return;
      }
      
      console.log('Found', lockedSites.length, 'locked sites');
      lockedWebsitesList.innerHTML = '';lockedSites.forEach((site, index) => {
        console.log('Processing site:', site, 'at index:', index);
        const listItem = document.createElement('li');
        listItem.className = 'locked-website-item';
        
        // Handle both string format (from popup) and object format
        let siteUrl, dateAdded;
        if (typeof site === 'string') {
          siteUrl = site;
          dateAdded = 'Unknown date';
        } else {
          siteUrl = site.url || site;
          dateAdded = new Date(site.dateAdded || Date.now()).toLocaleDateString();
        }
        
        // Ensure URL has proper protocol
        let fullUrl = siteUrl;
        if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
          fullUrl = 'https://' + siteUrl;
        }
        
        listItem.innerHTML = `
          <a href="${fullUrl}" target="_blank" class="website-link" rel="noopener noreferrer">
            ${siteUrl}
          </a>
        `;
        
        lockedWebsitesList.appendChild(listItem);
        console.log('Added list item for:', siteUrl);
      });
        console.log('Finished loading locked websites');
    } catch (error) {
      console.error('Error in loadLockedWebsites:', error);
    }
  }
  
  // Refresh websites list handler
  document.getElementById("refresh-websites").addEventListener("click", async () => {
    console.log('Refresh button clicked');
    showNotification("Refreshing locked websites list...", "success");
    await loadLockedWebsites();
  });
});

// Password Management Functions
function initializePasswordManagement() {
  // Initialize password toggle buttons
  const toggleButtons = document.querySelectorAll('.toggle-password');
  toggleButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const targetInput = document.getElementById(targetId);
      const icon = this.querySelector('i');
      
      if (targetInput.type === 'password') {
        targetInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        targetInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });

  // Initialize password strength checker
  const newPasswordInput = document.getElementById('new-password');
  if (newPasswordInput) {
    newPasswordInput.addEventListener('input', function() {
      checkPasswordStrength(this.value);
    });
  }
}

function checkPasswordStrength(password) {
  const strengthFill = document.getElementById('strength-fill');
  const strengthText = document.getElementById('strength-text');
  
  if (!strengthFill || !strengthText) return;
  
  let score = 0;
  let feedback = '';
  
  // Check password criteria
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  if (password.length >= 16) score += 10;
  
  // Determine strength level and color
  if (score === 0) {
    feedback = 'Enter a password';
    strengthFill.style.width = '0%';
    strengthFill.style.background = '#e9ecef';
  } else if (score < 30) {
    feedback = 'Very weak password';
    strengthFill.style.width = '20%';
    strengthFill.style.background = '#dc3545';
  } else if (score < 50) {
    feedback = 'Weak password';
    strengthFill.style.width = '40%';
    strengthFill.style.background = '#fd7e14';
  } else if (score < 70) {
    feedback = 'Fair password';
    strengthFill.style.width = '60%';
    strengthFill.style.background = '#ffc107';
  } else if (score < 90) {
    feedback = 'Good password';
    strengthFill.style.width = '80%';
    strengthFill.style.background = '#20c997';
  } else {
    feedback = 'Excellent password';
    strengthFill.style.width = '100%';
    strengthFill.style.background = '#28a745';
  }
  
  strengthText.textContent = feedback;
}
