fetch(chrome.runtime.getURL('locked_page.html'))
  .then((response) => response.text())
  .then((html) => {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.zIndex = '9999';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
  });
