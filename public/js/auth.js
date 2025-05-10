/**
 * Authentication module for handling user login and registration
 */
class AuthManager {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.loginForm = document.getElementById('login-form');
    this.registerForm = document.getElementById('register-form');
    this.loginTab = document.getElementById('login-tab');
    this.registerTab = document.getElementById('register-tab');
    this.logoutBtn = document.getElementById('logout-btn');
    this.authContainer = document.getElementById('auth-container');
    this.appContainer = document.getElementById('app-container');
    this.userNameElement = document.getElementById('user-name');
    this.userDepartmentElement = document.getElementById('user-department');
    
    this.initialize();
  }
  
  /**
   * Initialize the authentication state and event listeners
   */
  initialize() {
    // Check for existing token
    if (api.initializeToken()) {
      this.loadUserProfile();
    }
    
    // Setup event listeners
    this.setupEventListeners();
  }
  
  /**
   * Set up all event listeners for auth-related elements
   */
  setupEventListeners() {
    // Tab switching
    this.loginTab.addEventListener('click', () => this.switchTab('login'));
    this.registerTab.addEventListener('click', () => this.switchTab('register'));
    
    // Form submissions
    this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    
    // Logout button
    this.logoutBtn.addEventListener('click', () => this.logout());
    
    // Load departments for registration form
    if (this.registerForm) {
      this.loadDepartments();
    }
  }
  
  /**
   * Switch between login and register tabs
   * @param {string} tab - The tab to switch to ('login' or 'register')
   */
  switchTab(tab) {
    if (tab === 'login') {
      this.loginTab.classList.add('active');
      this.registerTab.classList.remove('active');
      this.loginForm.classList.remove('hidden');
      this.registerForm.classList.add('hidden');
    } else {
      this.loginTab.classList.remove('active');
      this.registerTab.classList.add('active');
      this.loginForm.classList.add('hidden');
      this.registerForm.classList.remove('hidden');
      
      // Make sure departments are loaded for registration
      this.loadDepartments();
    }
  }
  
  /**
   * Load departments for the registration form dropdown
   */
  async loadDepartments() {
    try {
      const departmentSelect = document.getElementById('register-department');
      if (!departmentSelect) return;
      
      // Clear existing options except for the placeholder
      while (departmentSelect.options.length > 1) {
        departmentSelect.remove(1);
      }
      
      const departments = await api.getDepartments();
      
      departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept._id;
        option.textContent = dept.name;
        departmentSelect.appendChild(option);
      });
    } catch (error) {
      showToast('Error loading departments: ' + error.message, 'error');
    }
  }
  
  /**
   * Handle login form submission
   * @param {Event} event - Form submit event
   */
  async handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
      const userData = await api.login(email, password);
      this.setUserData(userData);
      showToast('Login successful', 'success');
      this.showApp();
    } catch (error) {
      showToast('Login failed: ' + error.message, 'error');
    }
  }
  
  /**
   * Handle register form submission
   * @param {Event} event - Form submit event
   */
  async handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const department = document.getElementById('register-department').value;
    
    if (!name || !email || !password || !department) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    
    try {
      const userData = await api.register({ name, email, password, department });
      this.setUserData(userData);
      showToast('Registration successful', 'success');
      this.showApp();
    } catch (error) {
      showToast('Registration failed: ' + error.message, 'error');
    }
  }
  
  /**
   * Load the user profile using the stored token
   */
  async loadUserProfile() {
    try {
      const userData = await api.getUserProfile();
      this.setUserData(userData);
      this.showApp();
    } catch (error) {
      console.error('Failed to load user profile:', error);
      this.logout();
    }
  }
  
  /**
   * Set user data and update authentication state
   * @param {object} userData - User data from API
   */
  setUserData(userData) {
    this.user = userData;
    this.isAuthenticated = true;
    
    // Update UI elements with user information
    if (this.userNameElement) {
      this.userNameElement.textContent = userData.name;
    }
    
    if (this.userDepartmentElement && userData.department) {
      this.userDepartmentElement.textContent = userData.department.name;
    }
    
    // Show/hide admin-only elements
    this.updateAdminUI(userData.isAdmin);
  }
  
  /**
   * Show or hide admin-only elements
   * @param {boolean} isAdmin - Whether the user is an admin
   */
  updateAdminUI(isAdmin) {
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
      if (isAdmin) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });
  }
  
  /**
   * Show the main application UI
   */
  showApp() {
    if (this.authContainer) this.authContainer.classList.add('hidden');
    if (this.appContainer) this.appContainer.classList.remove('hidden');
    
    // Navigate to dashboard if ui is initialized
    if (window.ui && typeof window.ui.navigateTo === 'function') {
      window.ui.navigateTo('dashboard');
    }
  }
  
  /**
   * Show the authentication UI
   */
  showAuth() {
    if (this.authContainer) this.authContainer.classList.remove('hidden');
    if (this.appContainer) this.appContainer.classList.add('hidden');
  }
  
  /**
   * Log out the user
   */
  logout() {
    api.setAuthToken(null);
    this.user = null;
    this.isAuthenticated = false;
    this.showAuth();
    showToast('You have been logged out', 'info');
  }
  
  /**
   * Get the current user
   * @returns {object} User object or null if not authenticated
   */
  getUser() {
    return this.user;
  }
  
  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isUserAuthenticated() {
    return this.isAuthenticated;
  }
  
  /**
   * Check if user is an admin
   * @returns {boolean} Admin status
   */
  isAdmin() {
    return this.user && this.user.isAdmin;
  }
}

// Toast notification helper
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  
  if (!toastContainer) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <span class="close-toast">&times;</span>
  `;
  
  // Add close functionality
  const closeBtn = toast.querySelector('.close-toast');
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast && toast.parentNode) {
      toast.remove();
    }
  }, 5000);
}

// Create auth manager instance
const auth = new AuthManager();
