// Create lock overlay
const overlay = document.createElement("div");
overlay.id = "web-lock-overlay";
overlay.style.position = "fixed";
overlay.style.top = "0";
overlay.style.left = "0";
overlay.style.width = "100%";
overlay.style.height = "100%";
overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
overlay.style.zIndex = "9999";
overlay.style.display = "flex";
overlay.style.flexDirection = "column";
overlay.style.justifyContent = "center";
overlay.style.alignItems = "center";
overlay.style.color = "white";
overlay.style.fontSize = "20px";

const message = document.createElement("p");
message.textContent = "This website is locked. Enter the password to unlock.";
overlay.appendChild(message);

const input = document.createElement("input");
input.type = "password";
input.placeholder = "Enter password";
input.style.padding = "10px";
input.style.fontSize = "16px";
overlay.appendChild(input);

const button = document.createElement("button");
button.textContent = "Unlock";
button.style.marginTop = "10px";
button.style.padding = "10px 20px";
button.style.fontSize = "16px";
button.style.cursor = "pointer";
overlay.appendChild(button);

document.body.appendChild(overlay);

// Handle unlock
button.addEventListener("click", () => {
  const password = input.value;
  chrome.runtime.sendMessage(
    { type: "unlockSite", url: window.location.href, password },
    (response) => {
      if (response.success) {
        overlay.remove();
      } else {
        alert("Incorrect password");
      }
    }
  );
});
