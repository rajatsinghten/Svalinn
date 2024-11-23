class PopupManager {
  constructor() {
    this.currentPage = null;
    this.pages = ['registration', 'login', 'dashboard'];
    this.initialize();
  }

  async initialize() {
    // Check if user is registered
    const { userData } = await this.getStorageData('local', ['userData']);
    
    if (!userData || !userData.isRegistered) {
      this.showPage('registration');
    } else {
      // Check if user is logged in for this session
      const { isLoggedIn } = await this.getStorageData('session', ['isLoggedIn']);
      this.showPage(isLoggedIn ? 'dashboard' : 'login');
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Registration form submission
    document.getElementById('registration-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegistration();
    });

    // Login form submission
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    // Dashboard controls
    document.getElementById('add-site-btn')?.addEventListener('click', () => {
      this.handleAddSite();
    });

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      this.handleLogout();
    });

    document.getElementById('site-list')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('unlock-btn')) {
        this.handleUnlockSite(e.target.dataset.site);
      }
      if (e.target.classList.contains('remove-btn')) {
        this.handleRemoveSite(e.target.dataset.site);
      }
    });
  }

  async handleRegistration() {
    const name = document.getElementById('reg-name').value;
    const designation = document.getElementById('reg-designation').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const errorElement = document.getElementById('reg-error');

    if (password !== confirmPassword) {
      errorElement.textContent = 'Passwords do not match';
      errorElement.style.display = 'block';
      return;
    }

    try {
      const hashedPassword = await hashPassword(password);
      await this.setStorageData('local', {
        userData: {
          name,
          designation,
          password: hashedPassword,
          isRegistered: true
        },
        lockedSites: []
      });

      this.showPage('login');
    } catch (error) {
      errorElement.textContent = 'Registration failed. Please try again.';
      errorElement.style.display = 'block';
    }
  }

  async handleLogin() {
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');

    try {
      const { userData } = await this.getStorageData('local', ['userData']);
      const hashedPassword = await hashPassword(password);

      if (userData.password === hashedPassword) {
        await this.setStorageData('session', {
          isLoggedIn: true,
          unlockedSites: []
        });
        this.showPage('dashboard');
        this.loadDashboard();
      } else {
        errorElement.textContent = 'Incorrect password';
        errorElement.style.display = 'block';
      }
    } catch (error) {
      errorElement.textContent = 'Login failed. Please try again.';
      errorElement.style.display = 'block';
    }
  }

  async loadDashboard() {
    const { userData, lockedSites } = await this.getStorageData('local', ['userData', 'lockedSites']);
    
    // Update user info
    document.getElementById('user-name').textContent = userData.name;
    document.getElementById('user-designation').textContent = userData.designation;

    // Update site list
    this.updateSiteList(lockedSites || []);
  }

  async handleAddSite() {
    const input = document.getElementById('new-site-url');
    const url = input.value.trim();
    
    if (url) {
      const { lockedSites = [] } = await this.getStorageData('local', ['lockedSites']);
      if (!lockedSites.includes(url)) {
        lockedSites.push(url);
        await this.setStorageData('local', { lockedSites });
        this.updateSiteList(lockedSites);
        input.value = '';
      }
    }
  }

  async handleUnlockSite(site) {
    const { unlockedSites = [] } = await this.getStorageData('session', ['unlockedSites']);
    if (!unlockedSites.includes(site)) {
      unlockedSites.push(site);
      await this.setStorageData('session', { unlockedSites });
    }
  }

  async handleRemoveSite(site) {
    const { lockedSites = [] } = await this.getStorageData('local', ['lockedSites']);
    const updatedSites = lockedSites.filter(s => s !== site);
    await this.setStorageData('local', { lockedSites: updatedSites });
    this.updateSiteList(updatedSites);
  }

  async handleLogout() {
    await new Promise(resolve => chrome.storage.session.clear(resolve));
    this.showPage('login');
  }

  updateSiteList(sites) {
    const siteList = document.getElementById('site-list');
    siteList.innerHTML = sites.map(site => `
      <div class="site-item">
        <span class="site-url">${site}</span>
        <div class="site-controls">
          <button class="btn btn-secondary unlock-btn" data-site="${site}">Unlock</button>
          <button class="btn btn-danger remove-btn" data-site="${site}">Remove</button>
        </div>
      </div>
    `).join('');
  }

  showPage(pageId) {
    this.pages.forEach(page => {
      const element = document.getElementById(`${page}-page`);
      if (element) {
        element.classList.toggle('active', page === pageId);
      }
    });
    this.currentPage = pageId;
  }

  getStorageData(storageType, keys) {
    return new Promise(resolve => {
      chrome[`storage`][storageType].get(keys, resolve);
    });
  }

  setStorageData(storageType, data) {
    return new Promise(resolve => {
      chrome[`storage`][storageType].set(data, resolve);
    });
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});