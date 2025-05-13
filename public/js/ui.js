/**
 * UI Manager for handling page navigation and rendering
 */
class UIManager {
  constructor() {
    this.currentPage = 'dashboard';
    this.pages = {};
    this.navItems = [];
    
    this.initialize();
  }
  
  /**
   * Initialize the UI manager
   */
  initialize() {
    // Find all pages
    document.querySelectorAll('.page').forEach(page => {
      this.pages[page.id.replace('-page', '')] = page;
    });
    
    // Find all nav elements
    this.tabItems = document.querySelectorAll('.tab-item');
    this.submenuItems = document.querySelectorAll('.submenu-item');
    this.tabContents = document.querySelectorAll('.tab-content');
    
    // Set up navigation
    this.setupNavigation();
    
    // Initialize modals
    this.initializeModals();
    
    // Check if user is already authenticated
    if (auth && auth.isUserAuthenticated()) {
      // User is authenticated, navigate to dashboard
      this.navigateTo('dashboard');
      // Activate dashboard tab
      this.activateTab('dashboard');
    } else {
      // Don't navigate to any page if not authenticated
      // Auth module will handle showing the login page
      console.log('Người dùng chưa xác thực, đợi đăng nhập');
    }
  }
  
  /**
   * Set up navigation event listeners
   */
  setupNavigation() {
    // Tab navigation
    this.tabItems.forEach(item => {
      item.addEventListener('click', () => {
        const tabName = item.dataset.tab;
        this.activateTab(tabName);
      });
    });

    // Submenu navigation for pages
    this.submenuItems.forEach(item => {
      item.addEventListener('click', () => {
        const pageName = item.dataset.page;
        this.navigateTo(pageName);
        
        // Update active states
        this.submenuItems.forEach(subItem => subItem.classList.remove('active'));
        item.classList.add('active');
      });
    });
  }
  
  /**
   * Activate a main tab
   * @param {string} tabName - The name of the tab to activate
   */
  activateTab(tabName) {
    // Update tab item active states
    this.tabItems.forEach(item => {
      if (item.dataset.tab === tabName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // Update tab content visibility
    this.tabContents.forEach(content => {
      if (content.id === `${tabName}-tab-content`) {
        content.classList.remove('hidden');
      } else {
        content.classList.add('hidden');
      }
    });
    
    // If it's the dashboard tab, navigate to dashboard
    if (tabName === 'dashboard') {
      this.navigateTo('dashboard');
    }
  }
  
  /**
   * Navigate to a specific page
   * @param {string} pageName - The name of the page to navigate to
   */
  navigateTo(pageName) {
    // Hide all pages
    Object.values(this.pages).forEach(page => {
      page.classList.add('hidden');
    });
    
    // Remove active class from all nav items
    this.navItems.forEach(item => {
      item.classList.remove('active');
    });
    
    // Show requested page
    if (this.pages[pageName]) {
      this.pages[pageName].classList.remove('hidden');
      
      // Mark nav item as active
      const activeNavItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
      if (activeNavItem) {
        activeNavItem.classList.add('active');
      }
      
      this.currentPage = pageName;
      
      // Load page-specific data
      this.loadPageData(pageName);
    } else {
      console.error(`Không tìm thấy trang '${pageName}'`);
    }
  }
  
  /**
   * Load data specific to a page
   * @param {string} pageName - The name of the page
   */
  loadPageData(pageName) {
    switch (pageName) {
      case 'dashboard':
        this.loadDashboardData();
        break;
      // Blood Bottle Management pages
      case 'blood-bottle-import':
        this.initBloodBottleImportPage();
        break;
      case 'blood-bottle-distribute':
        this.initBloodBottleDistributePage();
        break;
      case 'blood-bottle-return':
        this.initBloodBottleReturnPage();
        break;
      case 'blood-bottle-stats':
        this.loadBloodBottleStatsPage();
        break;
      // Chemical Management pages  
      case 'import-chemical':
        this.initImportChemicalPage();
        break;
      case 'distribute':
        this.initDistributePage();
        break;
      case 'return':
        this.initReturnPage();
        break;
      case 'chemical-stats':
        this.loadChemicalStatsPage();
        break;
      case 'chemicals':
        this.loadChemicalsData();
        break;
      case 'unknown-barcodes':
        this.loadUnknownBarcodesData();
        break;
      // System Management pages
      case 'departments':
        this.loadDepartmentsData();
        break;
      case 'users':
        this.loadUsersData();
        break;
    }
  }
  
  /**
   * Initialize modal functionality
   */
  initializeModals() {
    // Set up close buttons
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
      closeBtn.addEventListener('click', () => {
        const modal = closeBtn.closest('.modal');
        if (modal) {
          modal.classList.add('hidden');
        }
      });
    });
    
    // Close modal when clicking outside content
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    });
    
    // Set up Add Chemical Type modal trigger
    const addChemicalTypeBtn = document.getElementById('add-chemical-type-btn');
    if (addChemicalTypeBtn) {
      addChemicalTypeBtn.addEventListener('click', () => {
        document.getElementById('add-chemical-type-modal').classList.remove('hidden');
        const form = document.getElementById('add-chemical-type-form');
        if (form) form.reset();
      });
    }
    
    // Set up Add Chemical Type form
    const addChemicalTypeForm = document.getElementById('add-chemical-type-form');
    if (addChemicalTypeForm) {
      addChemicalTypeForm.addEventListener('submit', (e) => this.handleAddChemicalTypeForm(e));
    }

    // Set up Add User modal trigger
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
      addUserBtn.addEventListener('click', () => {
        document.getElementById('add-user-modal').classList.remove('hidden');
        // Optionally clear form fields if modal was previously opened
        const addUserForm = document.getElementById('add-user-form');
        if (addUserForm) addUserForm.reset();
      });
    }

    // Set up Add User form
    const addUserForm = document.getElementById('add-user-form');
    if (addUserForm) {
      addUserForm.addEventListener('submit', (e) => this.handleAddUserForm(e));
    }

    // Set up Change Password modal trigger
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener('click', () => {
        console.log('Change Password button clicked. Showing modal...'); // Added log
        document.getElementById('change-password-modal').classList.remove('hidden');
        // Optionally clear form fields
        const changePasswordForm = document.getElementById('change-password-form');
        if (changePasswordForm) changePasswordForm.reset();
      });
    }

    // Set up Change Password form
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
      changePasswordForm.addEventListener('submit', (e) => this.handleChangePasswordForm(e));
    }

    // Set up Add Department modal trigger
    const addDepartmentBtn = document.getElementById('add-department-btn');
    if (addDepartmentBtn) {
      addDepartmentBtn.addEventListener('click', () => {
        document.getElementById('add-department-modal').classList.remove('hidden');
        const addDepartmentForm = document.getElementById('add-department-form');
        if (addDepartmentForm) addDepartmentForm.reset();
      });
    }

    // Set up Add Department form
    const addDepartmentForm = document.getElementById('add-department-form');
    if (addDepartmentForm) {
      addDepartmentForm.addEventListener('submit', (e) => this.handleAddDepartmentForm(e));
    }
  }

  /**
   * Handle the submission of the Add User form
   * @param {Event} event - Form submit event
   */
  async handleAddUserForm(event) {
    event.preventDefault();
    const name = document.getElementById('new-user-name').value.trim(); // Reverted to name
    // const email = document.getElementById('new-user-email').value.trim(); // Email removed
    const password = document.getElementById('new-user-password').value; // Reverted to password
    const isAdmin = document.getElementById('new-user-isAdmin').checked; // Reverted to isAdmin

    if (!name || !password) { // Reverted validation
      showToast('Vui lòng nhập tên đăng nhập và mật khẩu', 'error'); 
      return;
    }

    try {
      await api.createUserByAdmin({ name, password, isAdmin }); // Reverted to English fields
      showToast('Thêm người dùng thành công', 'success');
      document.getElementById('add-user-modal').classList.add('hidden');
      document.getElementById('add-user-form').reset();
      this.loadUsersData(); // Refresh the user list
    } catch (error) {
      showToast('Lỗi khi thêm người dùng: ' + error.message, 'error');
    }
  }
  
  /**
   * Handle the submission of the Add Department form
   * @param {Event} event - Form submit event
   */
  async handleAddDepartmentForm(event) {
    event.preventDefault();
    const name = document.getElementById('new-department-name').value.trim();
    const code = document.getElementById('new-department-code').value.trim();
    const description = document.getElementById('new-department-description').value.trim();

    if (!name || !code) {
      showToast('Vui lòng nhập tên khoa và mã khoa', 'error');
      return;
    }

    try {
      await api.createDepartment({ name, code, description });
      showToast('Thêm khoa thành công', 'success');
      document.getElementById('add-department-modal').classList.add('hidden');
      document.getElementById('add-department-form').reset();
      this.loadDepartmentsData(); // Refresh the department list
      // Also refresh dashboard data if it's the current page, as department count might change
      if (this.currentPage === 'dashboard') {
        this.loadDashboardData();
      }
    } catch (error) {
      showToast('Lỗi khi thêm khoa: ' + error.message, 'error');
    }
  }

  /**
   * Handle the submission of the Change Password form
   * @param {Event} event - Form submit event
   */
  async handleChangePasswordForm(event) {
    event.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showToast('Vui lòng nhập đầy đủ các trường', 'error');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showToast('Mật khẩu mới và xác nhận mật khẩu không khớp', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
      return;
    }

    try {
      await api.updateCurrentUserPassword(currentPassword, newPassword);
      showToast('Đổi mật khẩu thành công', 'success');
      document.getElementById('change-password-modal').classList.add('hidden');
      document.getElementById('change-password-form').reset();
    } catch (error) {
      showToast('Lỗi đổi mật khẩu: ' + error.message, 'error');
    }
  }
  
  /**
   * Load data for the dashboard
   */
  async loadDashboardData() {
    try {
      const [chemicalTypes, bloodBottleTypes, departments, unknownBarcodes, chemicalHistory, bloodBottleHistory] = await Promise.all([
        api.getChemicalTypes(),
        api.getBloodBottleTypes(),
        api.getDepartments(),
        api.getUnknownBarcodes(),
        api.getChemicalHistory() || [], // Fallback to empty array
        api.getBloodBottleStats() || {} // Fallback to empty object
      ]);
      
      let totalType1Stock = 0;
      let totalType2Stock = 0;
      chemicalTypes.forEach(type => {
        if (type.barcodeType === 'Type1') {
          totalType1Stock += type.stockQuantity || 0;
        } else if (type.barcodeType === 'Type2') {
          totalType2Stock += type.stockQuantityType2 || 0;
        }
      });

      let totalBloodBottleStock = 0;
      bloodBottleTypes.forEach(type => {
        totalBloodBottleStock += type.stockQuantity || 0;
      });
      
      // Update dashboard cards
      document.getElementById('total-type1-stock-dashboard').textContent = totalType1Stock;
      document.getElementById('total-type2-stock-dashboard').textContent = totalType2Stock;
      document.getElementById('department-count').textContent = departments.length;
      document.getElementById('unknown-barcodes-count').textContent = unknownBarcodes.length;
      
      // Combine and load recent activity
      const combinedActivity = [
        ...(chemicalHistory || []).map(item => ({
          ...item,
          type: 'chemical',
          timestampDate: new Date(item.createdAt)
        })),
        ...(bloodBottleHistory?.history || []).map(item => ({
          ...item,
          type: 'bloodBottle',
          timestampDate: new Date(item.createdAt)
        }))
      ];
      
      // Sort by timestamp, most recent first
      combinedActivity.sort((a, b) => b.timestampDate - a.timestampDate);
      
      this.loadRecentActivity(combinedActivity);
    } catch (error) {
      showToast('Lỗi khi tải dữ liệu bảng điều khiển: ' + error.message, 'error');
      // Set default values if API fails
      document.getElementById('total-type1-stock-dashboard').textContent = 'N/A';
      document.getElementById('total-type2-stock-dashboard').textContent = 'N/A';
      document.getElementById('department-count').textContent = 'N/A';
      document.getElementById('unknown-barcodes-count').textContent = 'N/A';
      const activityTable = document.getElementById('recent-activity-table');
      if(activityTable) activityTable.innerHTML = '<tr><td colspan="5" class="text-center">Lỗi tải dữ liệu</td></tr>';
    }
  }
  
  /**
   * Load recent activity data
   * @param {Array} combinedActivity - Combined chemical and blood bottle history data
   */
  loadRecentActivity(combinedActivity) {
    const activityTable = document.getElementById('recent-activity-table');
    if (!activityTable) return;
    
    activityTable.innerHTML = ''; // Clear existing rows
    
    if (!combinedActivity || combinedActivity.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 5; // Updated colspan
      cell.textContent = 'Không có hoạt động gần đây';
      cell.className = 'text-center';
      row.appendChild(cell);
      activityTable.appendChild(row);
      return;
    }
    
    // Take top 10 activities (already sorted by date)
    combinedActivity.slice(0, 10).forEach(activity => {
      const row = document.createElement('tr');
      
      let actionText = '';
      switch(activity.action) {
        case 'import': actionText = 'Nhập kho'; break;
        case 'distribute': actionText = 'Phân phối'; break;
        case 'return': actionText = 'Thu hồi'; break;
        case 'mark_used': actionText = 'Đánh dấu sử dụng'; break;
        case 'mark_expired': actionText = 'Đánh dấu hết hạn'; break;
        default: actionText = activity.action;
      }

      // Determine the type name (chemical or blood bottle)
      let typeName = '';
      if (activity.type === 'chemical') {
        typeName = activity.ChemicalType ? activity.ChemicalType.name : 'Hóa chất';
      } else if (activity.type === 'bloodBottle') {
        typeName = activity.BloodBottleType ? activity.BloodBottleType.name : 'Chai máu';
      } else {
        typeName = 'N/A';
      }

      // Determine item details (barcode or quantity)
      let itemDetails = '';
      if (activity.type === 'chemical') {
        itemDetails = activity.ChemicalItem ? activity.ChemicalItem.barcode : 
                     (activity.quantity ? `${activity.quantity} ${activity.ChemicalType?.unit || ''}` : 'N/A');
      } else if (activity.type === 'bloodBottle') {
        itemDetails = activity.BloodBottleItem ? activity.BloodBottleItem.barcode : 
                     (activity.quantity ? `${activity.quantity} ${activity.BloodBottleType?.unit || ''}` : 'N/A');
      } else {
        itemDetails = 'N/A';
      }

      // Determine department or recipient
      const departmentOrRecipient = activity.Department ? activity.Department.name : (activity.recipientName || 'N/A');
      
      row.innerHTML = `
        <td>${actionText}</td>
        <td>${typeName}</td>
        <td>${itemDetails}</td>
        <td>${departmentOrRecipient}</td>
        <td>${activity.timestampDate.toLocaleString()}</td>
      `;
      activityTable.appendChild(row);
    });
  }

  /**
   * Initialize the Blood Bottle Import page
   */
  async initBloodBottleImportPage() {
    const form = document.getElementById('import-blood-bottle-form');
    const typeSelect = document.getElementById('blood-bottle-type');
    const quantityInput = document.getElementById('blood-bottle-quantity');
    const lotNumberInput = document.getElementById('blood-bottle-lot-number');
    const expiryDateInput = document.getElementById('blood-bottle-expiry-date');
    const notesInput = document.getElementById('blood-bottle-import-notes');
    
    if (!form || !typeSelect) return;

    // Populate blood bottle types
    try {
      const bloodBottleTypes = await api.getBloodBottleTypes();
      typeSelect.innerHTML = '<option value="">Chọn loại chai máu</option>';
      bloodBottleTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = `${type.name} (${type.unit})`;
        typeSelect.appendChild(option);
      });
    } catch (error) {
      showToast('Lỗi khi tải danh sách loại chai máu: ' + error.message, 'error');
    }

    // Set default expiry date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expiryDateInput.valueAsDate = tomorrow;

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const bloodBottleTypeId = typeSelect.value;
      const quantity = parseInt(quantityInput.value, 10);
      const lotNumber = lotNumberInput.value.trim();
      const expiryDate = expiryDateInput.value;
      const notes = notesInput.value.trim();

      if (!bloodBottleTypeId) {
        showToast('Vui lòng chọn loại chai máu', 'error');
        return;
      }
      
      if (isNaN(quantity) || quantity <= 0) {
        showToast('Vui lòng nhập số lượng hợp lệ', 'error');
        return;
      }

      if (!lotNumber) {
        showToast('Vui lòng nhập số lô', 'error');
        return;
      }

      if (!expiryDate) {
        showToast('Vui lòng nhập hạn sử dụng', 'error');
        return;
      }

      try {
        await api.importBloodBottles({
          bloodBottleTypeId,
          quantity,
          lotNumber,
          expiryDate,
          notes
        });
        
        showToast('Nhập kho chai máu thành công', 'success');
        form.reset();
        
        // Reset expiry date to tomorrow
        expiryDateInput.valueAsDate = tomorrow;
        
        // Refresh dashboard data if on dashboard
        if (this.currentPage === 'dashboard') {
          this.loadDashboardData();
        }
      } catch (error) {
        showToast('Lỗi khi nhập kho chai máu: ' + error.message, 'error');
      }
    });
  }

  /**
   * Initialize the Blood Bottle Distribution page
   */
  async initBloodBottleDistributePage() {
    const form = document.getElementById('distribute-blood-bottle-form');
    const departmentSearch = document.getElementById('blood-bottle-department-search');
    const departmentResults = document.getElementById('blood-bottle-department-results');
    const selectedDepartment = document.getElementById('blood-bottle-selected-department');
    const departmentIdInput = document.getElementById('blood-bottle-distribute-department-id');
    const recipientInput = document.getElementById('blood-bottle-distribute-recipient');
    const barcodeInput = document.getElementById('blood-bottle-barcode-scan');
    const typeSelection = document.getElementById('blood-bottle-type-selection');
    const typeSelect = document.getElementById('blood-bottle-distribute-type');
    const lotSelection = document.getElementById('blood-bottle-lot-selection');
    const lotInput = document.getElementById('blood-bottle-distribute-lot');
    const expirySelection = document.getElementById('blood-bottle-expiry-selection');
    const expiryInput = document.getElementById('blood-bottle-distribute-expiry');
    const notesInput = document.getElementById('blood-bottle-distribute-notes');
    const expiryWarningModal = document.getElementById('expiry-warning-modal');
    const expiryWarningMessage = document.getElementById('expiry-warning-message');
    const continueDistributeBtn = document.getElementById('continue-distribute-btn');
    const cancelDistributeBtn = document.getElementById('cancel-distribute-btn');
    
    // Department search functionality
    if (departmentSearch && departmentResults && selectedDepartment && departmentIdInput) {
      departmentSearch.addEventListener('input', async () => {
        const searchTerm = departmentSearch.value.trim();
        if (searchTerm.length < 2) {
          departmentResults.innerHTML = '';
          return;
        }
        
        try {
          const departments = await api.searchDepartments(searchTerm);
          departmentResults.innerHTML = '';
          
          if (departments.length === 0) {
            departmentResults.innerHTML = '<div class="search-item">Không tìm thấy khoa nào</div>';
            return;
          }
          
          departments.forEach(dept => {
            const item = document.createElement('div');
            item.className = 'search-item';
            item.textContent = `${dept.name} (${dept.code})`;
            item.dataset.id = dept.id;
            item.addEventListener('click', () => {
              selectedDepartment.textContent = `${dept.name} (${dept.code})`;
              departmentIdInput.value = dept.id;
              departmentSearch.value = '';
              departmentResults.innerHTML = '';
            });
            departmentResults.appendChild(item);
          });
        } catch (error) {
          console.error('Lỗi khi tìm kiếm khoa:', error);
        }
      });
      
      // Close search results when clicking outside
      document.addEventListener('click', (e) => {
        if (!departmentSearch.contains(e.target) && !departmentResults.contains(e.target)) {
          departmentResults.innerHTML = '';
        }
      });
    }

    // Barcode input handler
    if (barcodeInput && typeSelection && typeSelect) {
      // Populate blood bottle types for the dropdown
      try {
        const bloodBottleTypes = await api.getBloodBottleTypes();
        typeSelect.innerHTML = '<option value="">Chọn loại chai máu</option>';
        bloodBottleTypes.forEach(type => {
          const option = document.createElement('option');
          option.value = type.id;
          option.textContent = `${type.name} (${type.unit})`;
          typeSelect.appendChild(option);
        });
      } catch (error) {
        console.error('Lỗi khi tải danh sách loại chai máu:', error);
      }
      
      barcodeInput.addEventListener('change', async () => {
        const barcode = barcodeInput.value.trim();
        if (!barcode) return;
        
        try {
          // Try to determine blood bottle type from barcode prefix
          const bloodBottleTypes = await api.getBloodBottleTypes();
          let matchedType = null;
          
          for (const type of bloodBottleTypes) {
            if (type.prefixCode && barcode.startsWith(type.prefixCode)) {
              matchedType = type;
              break;
            }
          }
          
          if (matchedType) {
            // Type is determined from prefix
            typeSelection.classList.add('hidden');
            typeSelect.value = '';
            lotSelection.classList.remove('hidden');
            expirySelection.classList.remove('hidden');
          } else {
            // Type can't be determined, show dropdown
            typeSelection.classList.remove('hidden');
            typeSelect.required = true;
            lotSelection.classList.remove('hidden');
            expirySelection.classList.remove('hidden');
          }
        } catch (error) {
          console.error('Lỗi khi kiểm tra loại chai máu:', error);
        }
      });
    }
    
    // Form submission
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const departmentId = departmentIdInput.value;
        const recipientName = recipientInput.value.trim();
        const barcode = barcodeInput.value.trim();
        const bloodBottleTypeId = typeSelect.value || null; // Optional if determined by prefix
        const lotNumber = lotInput.value.trim();
        const expiryDate = expiryInput.value;
        const notes = notesInput.value.trim();
        
        if (!departmentId) {
          showToast('Vui lòng chọn khoa nhận', 'error');
          return;
        }
        
        if (!recipientName) {
          showToast('Vui lòng nhập tên người nhận', 'error');
          return;
        }
        
        if (!barcode) {
          showToast('Vui lòng quét hoặc nhập mã vạch chai máu', 'error');
          return;
        }
        
        if (typeSelection.classList.contains('hidden') === false && !bloodBottleTypeId) {
          showToast('Vui lòng chọn loại chai máu', 'error');
          return;
        }
        
        if (!lotNumber) {
          showToast('Vui lòng nhập số lô', 'error');
          return;
        }
        
        if (!expiryDate) {
          showToast('Vui lòng nhập hạn sử dụng', 'error');
          return;
        }
        
        try {
          const data = {
            barcode,
            departmentId,
            recipientName,
            notes,
            lotNumber,
            expiryDate
          };
          
          if (bloodBottleTypeId) {
            data.bloodBottleTypeId = bloodBottleTypeId;
          }
          
          // First try without actually distributing to check for warnings
          try {
            const response = await api.distributeBloodBottle(data);
            
            if (response.warning) {
              // Show warning modal
              expiryWarningMessage.textContent = response.warning;
              expiryWarningModal.classList.remove('hidden');
              
              // Set up continue button
              continueDistributeBtn.onclick = async () => {
                try {
                  // Resubmit with ignore_warning=true
                  data.ignore_warning = true;
                  const finalResponse = await api.distributeBloodBottle(data);
                  showToast(finalResponse.message || 'Phân phối chai máu thành công', 'success');
                  
                  // Reset form and hide modal
                  form.reset();
                  selectedDepartment.textContent = '';
                  typeSelection.classList.add('hidden');
                  lotSelection.classList.add('hidden');
                  expirySelection.classList.add('hidden');
                  expiryWarningModal.classList.add('hidden');
                  
                  // Refresh dashboard if needed
                  if (this.currentPage === 'dashboard') {
                    this.loadDashboardData();
                  }
                } catch (innerError) {
                  showToast('Lỗi khi phân phối chai máu: ' + innerError.message, 'error');
                }
              };
              
              // Set up cancel button
              cancelDistributeBtn.onclick = () => {
                expiryWarningModal.classList.add('hidden');
              };
              
              // Stop here, wait for user decision
              return;
            }
            
            // No warning, show success
            showToast(response.message || 'Phân phối chai máu thành công', 'success');
            
            // Reset form
            form.reset();
            selectedDepartment.textContent = '';
            typeSelection.classList.add('hidden');
            lotSelection.classList.add('hidden');
            expirySelection.classList.add('hidden');
            
            // Refresh dashboard if needed
            if (this.currentPage === 'dashboard') {
              this.loadDashboardData();
            }
          } catch (error) {
            showToast('Lỗi khi phân phối chai máu: ' + error.message, 'error');
          }
        } catch (outerError) {
          showToast('Lỗi khi chuẩn bị phân phối chai máu: ' + outerError.message, 'error');
        }
      });
    }
  }

  /**
   * Initialize the Blood Bottle Return Page
   */
  async initBloodBottleReturnPage() {
    const scanButton = document.getElementById('blood-bottle-scan-return');
    const barcodeInput = document.getElementById('blood-bottle-return-barcode');
    const infoDiv = document.getElementById('blood-bottle-info');
    const returnButton = document.getElementById('return-blood-bottle-btn');
    const markUsedButton = document.getElementById('mark-used-blood-bottle-btn');
    const notesInput = document.getElementById('blood-bottle-return-notes');
    
    // Scan functionality
    if (scanButton && barcodeInput && infoDiv) {
      const scanBottle = async () => {
        const barcode = barcodeInput.value.trim();
        if (!barcode) {
          showToast('Vui lòng nhập mã vạch chai máu', 'error');
          return;
        }
        
        try {
          // Normally we'd have an API endpoint to get bottle details, but for now:
          // Just display minimal info and let the return API handle validation
          document.getElementById('blood-bottle-info-barcode').textContent = barcode;
          document.getElementById('blood-bottle-info-type').textContent = 'Đang kiểm tra...';
          document.getElementById('blood-bottle-info-lot').textContent = 'Đang kiểm tra...';
          document.getElementById('blood-bottle-info-expiry').textContent = 'Đang kiểm tra...';
          document.getElementById('blood-bottle-info-department').textContent = 'Đang kiểm tra...';
          document.getElementById('blood-bottle-info-recipient').textContent = 'Đang kiểm tra...';
          document.getElementById('blood-bottle-info-distribution-date').textContent = 'Đang kiểm tra...';
          document.getElementById('blood-bottle-info-status').textContent = 'Đang kiểm tra...';
          
          infoDiv.classList.remove('hidden');
        } catch (error) {
          showToast('Lỗi khi quét mã vạch chai máu: ' + error.message, 'error');
        }
      };
      
      scanButton.addEventListener('click', scanBottle);
      barcodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          scanBottle();
        }
      });
    }
    
    // Return button functionality
    if (returnButton) {
      returnButton.addEventListener('click', async () => {
        const barcode = barcodeInput.value.trim();
        const notes = notesInput.value.trim();
        
        if (!barcode) {
          showToast('Vui lòng quét mã vạch chai máu', 'error');
          return;
        }
        
        try {
          const result = await api.returnBloodBottle({ barcode, notes });
          showToast(result.message || 'Thu hồi chai máu thành công', 'success');
          
          // Reset form
          barcodeInput.value = '';
          notesInput.value = '';
          infoDiv.classList.add('hidden');
          
          // Refresh dashboard if needed
          if (this.currentPage === 'dashboard') {
            this.loadDashboardData();
          }
        } catch (error) {
          showToast('Lỗi khi thu hồi chai máu: ' + error.message, 'error');
        }
      });
    }
    
    // Mark as Used button functionality
    if (markUsedButton) {
      markUsedButton.addEventListener('click', async () => {
        const barcode = barcodeInput.value.trim();
        const notes = notesInput.value.trim();
        
        if (!barcode) {
          showToast('Vui lòng quét mã vạch chai máu', 'error');
          return;
        }
        
        try {
          const result = await api.markBloodBottleUsed({ barcode, notes });
          showToast(result.message || 'Đánh dấu chai máu đã sử dụng thành công', 'success');
          
          // Reset form
          barcodeInput.value = '';
          notesInput.value = '';
          infoDiv.classList.add('hidden');
          
          // Refresh dashboard if needed
          if (this.currentPage === 'dashboard') {
            this.loadDashboardData();
          }
        } catch (error) {
          showToast('Lỗi khi đánh dấu chai máu đã sử dụng: ' + error.message, 'error');
        }
      });
    }
  }

  /**
   * Load the Blood Bottle Stats page
   */
  async loadBloodBottleStatsPage() {
    const startDateInput = document.getElementById('blood-bottle-stats-start-date');
    const endDateInput = document.getElementById('blood-bottle-stats-end-date');
    const typeSelect = document.getElementById('blood-bottle-stats-type');
    const departmentSelect = document.getElementById('blood-bottle-stats-department');
    const statusSelect = document.getElementById('blood-bottle-stats-status');
    const lotNumberInput = document.getElementById('blood-bottle-stats-lot');
    const applyFiltersBtn = document.getElementById('apply-blood-bottle-filters-btn');
    const resetFiltersBtn = document.getElementById('reset-blood-bottle-filters-btn');

    const totalImportedSpan = document.getElementById('blood-bottle-total-imported');
    const totalStockSpan = document.getElementById('blood-bottle-total-stock');
    const totalDistributedSpan = document.getElementById('blood-bottle-total-distributed');
    const totalUsedSpan = document.getElementById('blood-bottle-total-used');
    
    const expiringTable = document.getElementById('expiring-blood-bottles-table');
    const historyTable = document.getElementById('blood-bottle-history-table');
    
    // Load blood bottle types
    try {
      const bloodBottleTypes = await api.getBloodBottleTypes();
      typeSelect.innerHTML = '<option value="">Tất cả</option>';
      bloodBottleTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = type.name;
        typeSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Lỗi khi tải danh sách loại chai máu:', error);
    }
    
    // Load departments
    try {
      const departments = await api.getDepartments();
      departmentSelect.innerHTML = '<option value="">Tất cả</option>';
      departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.name;
        departmentSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Lỗi khi tải danh sách khoa:', error);
    }
    
    // Load stats with no filters initially
    await loadStats();
    
    // Apply filters button
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => {
        loadStats();
      });
    }
    
    // Reset filters button
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => {
        startDateInput.value = '';
        endDateInput.value = '';
        typeSelect.value = '';
        departmentSelect.value = '';
        statusSelect.value = '';
        lotNumberInput.value = '';
        loadStats();
      });
    }
    
    // Function to load stats with current filters
    async function loadStats() {
      const filters = {
        startDate: startDateInput.value || undefined,
        endDate: endDateInput.value || undefined,
        bloodBottleTypeId: typeSelect.value || undefined,
        departmentId: departmentSelect.value || undefined,
        status: statusSelect.value || undefined,
        lotNumber: lotNumberInput.value.trim() || undefined
      };
      
      try {
        const stats = await api.getBloodBottleStats(filters);
        
        // Update summary stats
        if (totalImportedSpan) totalImportedSpan.textContent = stats.totalImported || 0;
        if (totalStockSpan) totalStockSpan.textContent = stats.stock?.length || 0;
        if (totalDistributedSpan) totalDistributedSpan.textContent = stats.items?.filter(i => i.status === 'distributed').length || 0;
        if (totalUsedSpan) totalUsedSpan.textContent = stats.items?.filter(i => i.status === 'used').length || 0;
        
        // Update expiring bottles table
        if (expiringTable) {
          expiringTable.innerHTML = '';
          
          if (!stats.expiring || stats.expiring.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 6;
            cell.textContent = 'Không có chai máu sắp hết hạn';
            cell.className = 'text-center';
            row.appendChild(cell);
            expiringTable.appendChild(row);
          } else {
            stats.expiring.forEach(item => {
              const row = document.createElement('tr');
              row.className = 'expiring-item';
              row.innerHTML = `
                <td>${item.BloodBottleType?.name || 'N/A'}</td>
                <td>${item.barcode}</td>
                <td>${item.lotNumber}</td>
                <td>${new Date(item.expiryDate).toLocaleDateString()}</td>
                <td>${translateStatus(item.status)}</td>
                <td>${item.currentDepartment?.name || 'Kho'}</td>
              `;
              expiringTable.appendChild(row);
            });
          }
        }
        
        // Update history table
        if (historyTable) {
          historyTable.innerHTML = '';
          
          if (!stats.history || stats.history.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 7;
            cell.textContent = 'Không có lịch sử hoạt động';
            cell.className = 'text-center';
            row.appendChild(cell);
            historyTable.appendChild(row);
          } else {
            stats.history.forEach(record => {
              const row = document.createElement('tr');
              row.className = 'history-item';
              
              let actionText = translateAction(record.action);
              
              row.innerHTML = `
                <td>${new Date(record.createdAt).toLocaleString()}</td>
                <td>${actionText}</td>
                <td>${record.BloodBottleType?.name || 'N/A'}</td>
                <td>${record.BloodBottleItem?.barcode || (record.quantity ? `${record.quantity} ${record.BloodBottleType?.unit || 'chai'}` : 'N/A')}</td>
                <td>${record.lotNumber || record.BloodBottleItem?.lotNumber || 'N/A'}</td>
                <td>${record.Department?.name || record.recipientName || 'N/A'}</td>
                <td>${record.notes || ''}</td>
              `;
              historyTable.appendChild(row);
            });
          }
        }
      } catch (error) {
        showToast('Lỗi khi tải thống kê chai máu: ' + error.message, 'error');
      }
    }
    
    // Helper function to translate status
    function translateStatus(status) {
      switch (status) {
        case 'distributed': return 'Đã phân phối';
        case 'returned': return 'Đã thu hồi';
        case 'used': return 'Đã sử dụng';
        case 'expired': return 'Hết hạn';
        case 'lost': return 'Bị mất';
        default: return status;
      }
    }
    
    // Helper function to translate action
    function translateAction(action) {
      switch (action) {
        case 'import': return 'Nhập kho';
        case 'distribute': return 'Phân phối';
        case 'return': return 'Thu hồi';
        case 'mark_used': return 'Đánh dấu đã sử dụng';
        case 'mark_expired': return 'Đánh dấu hết hạn';
        default: return action;
      }
    }
  }
  
  /**
   * Initialize the Distribute Chemicals page
   */
  async initDistributePage() {
    const departmentSearch = document.getElementById('department-search');
    const departmentResults = document.getElementById('department-results');
    const selectedDepartment = document.getElementById('selected-department');
    const departmentIdInput = document.getElementById('distribute-department-id');
    const distributeForm = document.getElementById('distribute-form');
    const barcodeInput = document.getElementById('barcode-scan');
    const quantityGroup = document.getElementById('quantity-group');
    const quantityInput = document.getElementById('distribute-quantity');
    const recipientInput = document.getElementById('distribute-recipient');
    
    // Populate department search (similar to existing logic)
    if (departmentSearch && departmentResults) {
      departmentSearch.addEventListener('input', async () => {
        const searchTerm = departmentSearch.value.trim();
        if (searchTerm.length < 2) { departmentResults.innerHTML = ''; return; }
        try {
          const departments = await api.searchDepartments(searchTerm);
          departmentResults.innerHTML = '';
          if (departments.length === 0) {
            departmentResults.innerHTML = '<div class="search-item">Không tìm thấy khoa nào</div>'; return;
          }
          departments.forEach(dept => {
            const item = document.createElement('div');
            item.textContent = `${dept.name} (${dept.code})`;
            item.className = 'search-item';
            item.dataset.id = dept.id; 
            item.addEventListener('click', () => {
              selectedDepartment.textContent = `${dept.name} (${dept.code})`;
              departmentIdInput.value = dept.id;
              departmentSearch.value = '';
              departmentResults.innerHTML = '';
            });
            departmentResults.appendChild(item);
          });
        } catch (error) { console.error('Lỗi khi tìm kiếm khoa:', error); }
      });
      document.addEventListener('click', (e) => {
        if (!departmentSearch.contains(e.target) && !departmentResults.contains(e.target)) {
          departmentResults.innerHTML = '';
        }
      });
    }

    // Barcode input logic - check if Type 1 to show quantity
    let chemicalTypes = [];
    try {
        chemicalTypes = await api.getChemicalTypes();
    } catch(e) { console.error("Failed to load chemical types for distribution page"); }

    if (barcodeInput) {
        barcodeInput.addEventListener('change', () => { // Or 'blur' or 'input'
            const barcode = barcodeInput.value.trim();
            const matchedType1 = chemicalTypes.find(ct => ct.barcodeType === 'Type1' && ct.representativeCode === barcode);
            if (matchedType1) {
                quantityGroup.classList.remove('hidden');
                quantityInput.required = true;
            } else {
                quantityGroup.classList.add('hidden');
                quantityInput.required = false;
                quantityInput.value = ''; // Clear quantity if not Type 1
            }
        });
    }

    // Form submission
    if (distributeForm) {
      distributeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const departmentId = departmentIdInput.value;
        const recipientName = recipientInput.value.trim();
        const barcode = barcodeInput.value.trim();
        const notes = document.getElementById('distribute-notes').value.trim();
        let qty = null;

        if (!departmentId) { showToast('Vui lòng chọn khoa', 'error'); return; }
        if (!recipientName) { showToast('Vui lòng nhập tên người nhận', 'error'); return; }
        if (!barcode) { showToast('Vui lòng quét hoặc nhập mã vạch', 'error'); return; }

        const matchedType1 = chemicalTypes.find(ct => ct.barcodeType === 'Type1' && ct.representativeCode === barcode);
        if (matchedType1) {
            qty = parseInt(quantityInput.value, 10);
            if (isNaN(qty) || qty <= 0) {
                showToast('Vui lòng nhập số lượng hợp lệ cho hóa chất Kiểu 1', 'error');
                return;
            }
        }

        try {
          const result = await api.distributeChemicals({
            departmentId,
            recipientName,
            barcode,
            quantity: qty, // Will be null if not Type 1
            notes
          });
          showToast(result.message || 'Phân phối hóa chất thành công', 'success');
          distributeForm.reset();
          selectedDepartment.textContent = '';
          quantityGroup.classList.add('hidden');
          if (this.currentPage === 'dashboard') this.loadDashboardData();
        } catch (error) {
          showToast('Lỗi khi phân phối hóa chất: ' + error.message, 'error');
        }
      });
    }
  }
  
  /**
   * Initialize the Return Chemicals page
   */
  initReturnPage() {
    const scanButton = document.getElementById('scan-return-barcode');
    const barcodeInput = document.getElementById('return-barcode'); // Renamed from codeInput
    const chemicalItemInfoDiv = document.getElementById('chemical-item-info'); // Renamed
    const returnChemicalBtn = document.getElementById('return-chemical-btn'); // Renamed
    const batchInfoDiv = document.getElementById('batch-info'); // Keep for now, but hide

    if(batchInfoDiv) batchInfoDiv.classList.add('hidden'); // Hide batch info for now

    if (scanButton && barcodeInput) {
      const scanChemical = async () => {
        const barcode = barcodeInput.value.trim();
        if (!barcode) { showToast('Vui lòng nhập mã vạch', 'error'); return; }
        
        // For return, we expect to find a ChemicalItem.
        // The backend will handle if it's a known distributed item.
        // Here, we can just enable the return form.
        // A more advanced UI might pre-fetch item details if available.
        // For now, just show the form to allow return attempt.
        this.displayChemicalItemInfo({ barcode: barcode }, true); // Pass true to indicate it's a scan, not full data
        chemicalItemInfoDiv.classList.remove('hidden');
      };
      
      scanButton.addEventListener('click', scanChemical);
      barcodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); scanChemical(); }
      });
    }
    
    if (returnChemicalBtn) {
      returnChemicalBtn.addEventListener('click', async () => {
        const barcode = barcodeInput.value.trim();
        const notes = document.getElementById('return-notes').value.trim();
        
        if (!barcode) { showToast('Không có mã vạch để thu hồi', 'error'); return; }
        
        try {
          const result = await api.returnChemicals({ barcode, notes });
          showToast(result.message || 'Thu hồi hóa chất thành công', 'success');
          barcodeInput.value = '';
          document.getElementById('return-notes').value = '';
          chemicalItemInfoDiv.classList.add('hidden');
          if (this.currentPage === 'dashboard') this.loadDashboardData();
        } catch (error) {
          showToast(error.message || 'Lỗi khi thu hồi hóa chất', 'error');
           // If error indicates unknown barcode, it's already logged by backend.
           // UI might still clear the form or keep barcode for user to check.
        }
      });
    }
  }
  
  /**
   * Display ChemicalItem information in the UI
   * @param {object} item - ChemicalItem data (can be partial for scan)
   * @param {boolean} isScanOnly - True if only barcode is available from scan
   */
  displayChemicalItemInfo(item, isScanOnly = false) {
    document.getElementById('item-info-barcode').textContent = item.barcode;
    if (isScanOnly) {
        document.getElementById('item-info-chemical-type').textContent = 'Đang tra cứu...';
        document.getElementById('item-info-department').textContent = 'Đang tra cứu...';
        document.getElementById('item-info-user').textContent = 'Đang tra cứu...';
        document.getElementById('item-info-distribution-date').textContent = 'Đang tra cứu...';
        document.getElementById('item-info-status').textContent = 'Đang tra cứu...';
    } else {
        // This part would be populated if we pre-fetch full item details after scan
        document.getElementById('item-info-chemical-type').textContent = item.ChemicalType?.name || 'N/A';
        document.getElementById('item-info-department').textContent = item.Department?.name || 'N/A';
        document.getElementById('item-info-user').textContent = item.User?.name || item.recipientName || 'N/A';
        document.getElementById('item-info-distribution-date').textContent = item.distributionDate ? new Date(item.distributionDate).toLocaleString() : 'N/A';
        document.getElementById('item-info-status').textContent = item.status || 'N/A';
    }
  }
  
  /**
   * Display batch information in the UI
   * @param {object} batch - Batch data from API
   */
  displayBatchInfo(batch) {
    document.getElementById('batch-info-id').textContent = batch.batchId;
    document.getElementById('batch-info-source').textContent = 
      batch.sourceDepartment?.name || 'N/A';
    document.getElementById('batch-info-target').textContent = 
      batch.targetDepartment?.name || 'N/A';
    document.getElementById('batch-info-total').textContent = batch.bottleCount;
    document.getElementById('batch-info-returned').textContent = batch.returnedCount;
    document.getElementById('batch-info-status').textContent = 
      batch.status === 'completed' ? 'Hoàn thành' : 'Đang hoạt động';
    
    // Add status color
    const statusElement = document.getElementById('batch-info-status');
    if (batch.status === 'completed') {
      statusElement.classList.add('text-success');
      statusElement.classList.remove('text-warning');
    } else {
      statusElement.classList.add('text-warning');
      statusElement.classList.remove('text-success');
    }
  }
  
  /**
   * Load departments data for the departments page
   */
  async loadDepartmentsData() {
    const departmentsTable = document.getElementById('departments-table');
    const searchInput = document.getElementById('department-search-filter');
    
    if (!departmentsTable) return;
    
    try {
      const departments = await api.getDepartments();
      
      const renderDepartments = (depts) => {
        departmentsTable.innerHTML = '';
        
        if (depts.length === 0) {
          const row = document.createElement('tr');
          const cell = document.createElement('td');
          cell.colSpan = 4;
          cell.textContent = 'Không tìm thấy khoa nào';
          cell.className = 'text-center';
          row.appendChild(cell);
          departmentsTable.appendChild(row);
          return;
        }
        
        depts.forEach(dept => {
          const row = document.createElement('tr');
          
          const nameCell = document.createElement('td');
          nameCell.textContent = dept.name;
          
          const codeCell = document.createElement('td');
          codeCell.textContent = dept.code;
          
          const unreturnedItemsCell = document.createElement('td');
          // This needs a new API endpoint or data from getDepartments to show count of unreturned Type 2 items
          unreturnedItemsCell.textContent = dept.unreturnedChemicalsCount || 'N/A'; // Placeholder
          
          const actionsCell = document.createElement('td');
          actionsCell.className = 'action-cell';
          
          const viewButton = document.createElement('button');
          viewButton.className = 'btn btn-sm';
          viewButton.textContent = 'Xem';
          viewButton.addEventListener('click', () => {
            this.showDepartmentDetails(dept.id || dept._id);
          });
          
          actionsCell.appendChild(viewButton);
          
          if (auth.isAdmin()) {
            const editButton = document.createElement('button');
            editButton.className = 'btn btn-sm btn-outline';
            editButton.textContent = 'Sửa';
            editButton.addEventListener('click', () => {
              showToast('Chức năng sửa chưa được triển khai', 'info');
            });
            actionsCell.appendChild(editButton);
          }
          
          row.appendChild(nameCell);
          row.appendChild(codeCell);
          row.appendChild(unreturnedItemsCell);
          row.appendChild(actionsCell);
          
          departmentsTable.appendChild(row);
        });
      };
      
      renderDepartments(departments);
      
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          const searchTerm = searchInput.value.toLowerCase();
          const filteredDepts = departments.filter(dept => 
            dept.name.toLowerCase().includes(searchTerm) || 
            dept.code.toLowerCase().includes(searchTerm)
          );
          renderDepartments(filteredDepts);
        });
      }
    } catch (error) {
      showToast('Lỗi khi tải danh sách khoa: ' + error.message, 'error');
    }
  }
  
  /**
   * Show department details in a modal
   * @param {string} departmentId - Department ID
   */
  async showDepartmentDetails(departmentId) {
    const modal = document.getElementById('department-detail-modal');
    const content = document.getElementById('department-detail-content');
    const itemsTable = document.getElementById('unreturned-bottles-table'); // ID needs update in HTML if changed
    
    if (!modal || !content || !itemsTable) return;
    
    try {
      // This API endpoint /departments/:id/unreturned-chemicals needs to be created
      // It should return department info and a list of unreturned ChemicalItems
      const departmentDetails = await api.getDepartmentById(departmentId); // Basic info
      // const unreturnedChemicalsData = await api.getUnreturnedChemicalsByDepartment(departmentId); // Ideal
      
      content.innerHTML = `
        <div class="info-row">
          <span class="info-label">Tên:</span>
          <span class="info-value">${departmentDetails.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Mã:</span>
          <span class="info-value">${departmentDetails.code}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Hóa Chất Type 2 Chưa Trả:</span>
          <span class="info-value">${departmentDetails.unreturnedChemicalsCount || 'N/A'}</span> <!-- Placeholder -->
        </div>
      `;
      
      itemsTable.innerHTML = '';
      // Placeholder for unreturned items list - requires backend support
      const tempRow = document.createElement('tr');
      const tempCell = document.createElement('td');
      tempCell.colSpan = 3;
      tempCell.textContent = 'Chức năng hiển thị hóa chất chưa trả đang được phát triển.';
      tempCell.className = 'text-center';
      tempRow.appendChild(tempCell);
      itemsTable.appendChild(tempRow);
      
      modal.classList.remove('hidden');
    } catch (error) {
      showToast('Lỗi khi tải chi tiết khoa: ' + error.message, 'error');
    }
  }
  
  /**
   * Load data for the Chemicals Management page
   */
  async loadChemicalsData() {
    const chemicalTypesTable = document.getElementById('chemical-types-table');
    const searchInput = document.getElementById('chemical-type-search');

    if (!chemicalTypesTable) return;

    try {
      const chemicalTypes = await api.getChemicalTypes();
      
      const renderChemicalTypes = (types) => {
        chemicalTypesTable.innerHTML = '';
        
        if (types.length === 0) {
          const row = document.createElement('tr');
          const cell = document.createElement('td');
          cell.colSpan = 7;
          cell.textContent = 'Không tìm thấy loại hóa chất nào';
          cell.className = 'text-center';
          row.appendChild(cell);
          chemicalTypesTable.appendChild(row);
          return;
        }

        types.forEach(type => {
          const row = document.createElement('tr');
          
          const nameCell = document.createElement('td');
          nameCell.textContent = type.name;
          
          const unitCell = document.createElement('td');
          unitCell.textContent = type.unit;
          
          const barcodeTypeCell = document.createElement('td');
          barcodeTypeCell.textContent = type.barcodeType;
          
          const codeCell = document.createElement('td');
          codeCell.textContent = type.representativeCode || 'N/A';
          
          const stock1Cell = document.createElement('td');
          stock1Cell.textContent = type.barcodeType === 'Type1' ? type.stockQuantity : 'N/A';
          
          const stock2Cell = document.createElement('td');
          stock2Cell.textContent = type.barcodeType === 'Type2' ? type.stockQuantityType2 : 'N/A';
          
          const actionsCell = document.createElement('td');
          actionsCell.className = 'action-cell';
          
          const editButton = document.createElement('button');
          editButton.className = 'btn btn-sm btn-outline';
          editButton.textContent = 'Sửa';
          editButton.addEventListener('click', () => {
            this.handleEditChemicalType(type.id);
          });
          
          const deleteButton = document.createElement('button');
          deleteButton.className = 'btn btn-sm btn-danger';
          deleteButton.textContent = 'Xóa';
          deleteButton.addEventListener('click', () => {
            this.handleDeleteChemicalType(type.id);
          });
          
          actionsCell.appendChild(editButton);
          actionsCell.appendChild(deleteButton);
          
          row.appendChild(nameCell);
          row.appendChild(unitCell);
          row.appendChild(barcodeTypeCell);
          row.appendChild(codeCell);
          row.appendChild(stock1Cell);
          row.appendChild(stock2Cell);
          row.appendChild(actionsCell);
          
          chemicalTypesTable.appendChild(row);
        });
      };

      // Initial render
      renderChemicalTypes(chemicalTypes);
      
      // Add search functionality
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          const searchTerm = searchInput.value.toLowerCase();
          const filteredTypes = chemicalTypes.filter(type => 
            type.name.toLowerCase().includes(searchTerm) ||
            (type.representativeCode && type.representativeCode.toLowerCase().includes(searchTerm))
          );
          renderChemicalTypes(filteredTypes);
        });
      }
    } catch (error) {
      showToast('Lỗi khi tải danh sách hóa chất: ' + error.message, 'error');
    }
  }

  /**
   * Load users data for the users management page
   */
  async loadUsersData() {
    const usersTable = document.getElementById('users-table');
    
    if (!usersTable) return;
    
    try {
      const users = await api.getUsers();
      
      usersTable.innerHTML = '';
      
      if (users.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 3; // Colspan is already 3 (Name, Role, Actions)
        cell.textContent = 'Không tìm thấy người dùng nào';
        cell.className = 'text-center';
        row.appendChild(cell);
        usersTable.appendChild(row);
        return;
      }
      
      users.forEach(user => {
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = user.name; // Reverted to name
        
        // const emailCell = document.createElement('td'); // Email cell removed
        // emailCell.textContent = user.email; // Email cell removed
        
        // const deptCell = document.createElement('td'); // Removed department cell
        // deptCell.textContent = user.department?.name || 'N/A'; // Removed
        
        const roleCell = document.createElement('td');
        roleCell.textContent = user.isAdmin ? 'Quản trị viên' : 'Người dùng'; // Reverted to isAdmin

        const actionsCell = document.createElement('td');
        actionsCell.className = 'action-cell';

        const resetButton = document.createElement('button');
        resetButton.className = 'btn btn-sm btn-outline';
        resetButton.textContent = 'Đặt lại MK';
        resetButton.title = 'Đặt lại mật khẩu';
        if (user.id === auth.getUser()?.id) { // Prevent admin from resetting their own password via this button
            resetButton.disabled = true;
            resetButton.title = 'Dùng chức năng "Đổi mật khẩu" cá nhân';
        } else {
            resetButton.addEventListener('click', async () => {
                const newPassword = prompt(`Nhập mật khẩu mới cho người dùng "${user.name}":`); // Reverted to name
                if (newPassword && newPassword.trim() !== '') {
                    try {
                        await api.resetPasswordByAdmin(user.id, newPassword.trim());
                        showToast(`Đặt lại mật khẩu cho ${user.name} thành công.`, 'success'); // Reverted to name
                    } catch (error) {
                        showToast(`Lỗi đặt lại mật khẩu: ${error.message}`, 'error');
                    }
                } else if (newPassword !== null) { // Not cancelled, but empty
                    showToast('Mật khẩu mới không được để trống.', 'warning');
                }
            });
        }
        actionsCell.appendChild(resetButton);
        
        row.appendChild(nameCell);
        // row.appendChild(emailCell); // Email cell removed
        // row.appendChild(deptCell); // Removed department cell
        row.appendChild(roleCell);
        row.appendChild(actionsCell); // Added actions cell
        
        usersTable.appendChild(row);
      });
    } catch (error) {
      showToast('Lỗi khi tải danh sách người dùng: ' + error.message, 'error');
    }
  }

  /**
   * Initialize the Import Chemical page
   */
  async initImportChemicalPage() {
    const form = document.getElementById('import-chemical-form');
    const chemicalTypeSelect = document.getElementById('import-chemical-type');

    if (!form || !chemicalTypeSelect) return;

    // Populate chemical types
    try {
      const chemicalTypes = await api.getChemicalTypes();
      chemicalTypeSelect.innerHTML = '<option value="">Chọn loại hóa chất</option>'; // Clear existing
      chemicalTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = `${type.name} (${type.unit}) - Kiểu ${type.barcodeType}`;
        chemicalTypeSelect.appendChild(option);
      });
    } catch (error) {
      showToast('Lỗi khi tải danh sách loại hóa chất: ' + error.message, 'error');
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const chemicalTypeId = chemicalTypeSelect.value;
      const quantity = parseInt(document.getElementById('import-quantity').value, 10);
      const batchId = document.getElementById('import-batch-id').value.trim();
      const notes = document.getElementById('import-notes').value.trim();

      if (!chemicalTypeId) {
        showToast('Vui lòng chọn loại hóa chất', 'error');
        return;
      }
      if (isNaN(quantity) || quantity <= 0) {
        showToast('Vui lòng nhập số lượng hợp lệ', 'error');
        return;
      }

      try {
        await api.importChemicals({ chemicalTypeId, quantity, batchId, notes });
        showToast('Nhập kho hóa chất thành công', 'success');
        form.reset();
        // Optionally, refresh dashboard or chemical list if on that page
        if (this.currentPage === 'dashboard') this.loadDashboardData();
        if (this.currentPage === 'chemicals') this.loadChemicalsData();
      } catch (error) {
        showToast('Lỗi khi nhập kho: ' + error.message, 'error');
      }
    });
  }

  /**
   * Load data for the Chemicals Management page
   */
  async loadChemicalsData() {
    const chemicalTypesTable = document.getElementById('chemical-types-table');
    const searchInput = document.getElementById('chemical-type-search');
    // TODO: Update info cards for total stock on this page if needed

    if (!chemicalTypesTable) return;

    try {
      const chemicalTypes = await api.getChemicalTypes();
      
      const renderChemicalTypes = (types) => {
        chemicalTypesTable.innerHTML = '';
        
        if (types.length === 0) {
          const row = document.createElement('tr');
          const cell = document.createElement('td');
          cell.colSpan = 7;
          cell.textContent = 'Không tìm thấy loại hóa chất nào';
          cell.className = 'text-center py-4 text-gray-500';
          row.appendChild(cell);
          chemicalTypesTable.appendChild(row);
          return;
        }

        // Add table header
        const headerRow = document.createElement('tr');
        headerRow.className = 'bg-gray-100';
        headerRow.innerHTML = `
          <th class="px-4 py-2">Tên</th>
          <th class="px-4 py-2">Đơn vị</th>
          <th class="px-4 py-2">Kiểu mã</th>
          <th class="px-4 py-2">Mã đại diện</th>
          <th class="px-4 py-2">Tồn kho (Type 1)</th>
          <th class="px-4 py-2">Tồn kho (Type 2)</th>
          <th class="px-4 py-2">Thao tác</th>
        `;
        chemicalTypesTable.appendChild(headerRow);

        types.forEach(type => {
          const row = document.createElement('tr');
          row.className = 'hover:bg-gray-50 border-b';
          row.innerHTML = `
            <td class="px-4 py-2">${type.name}</td>
            <td class="px-4 py-2">${type.unit}</td>
            <td class="px-4 py-2">${type.barcodeType}</td>
            <td class="px-4 py-2">${type.representativeCode || 'N/A'}</td>
            <td class="px-4 py-2 text-right">${type.barcodeType === 'Type1' ? type.stockQuantity : 'N/A'}</td>
            <td class="px-4 py-2 text-right">${type.barcodeType === 'Type2' ? type.stockQuantityType2 : 'N/A'}</td>
            <td class="px-4 py-2 action-cell">
              <button class="btn btn-sm btn-outline edit-chemical-type-btn" data-id="${type.id}">Sửa</button>
              <button class="btn btn-sm btn-danger delete-chemical-type-btn" data-id="${type.id}">Xóa</button>
            </td>
          `;
          chemicalTypesTable.appendChild(row);
        });

        // Add event listeners for edit/delete buttons
        document.querySelectorAll('.edit-chemical-type-btn').forEach(btn => {
          btn.addEventListener('click', (e) => this.handleEditChemicalType(e.target.dataset.id));
        });
        document.querySelectorAll('.delete-chemical-type-btn').forEach(btn => {
          btn.addEventListener('click', (e) => this.handleDeleteChemicalType(e.target.dataset.id));
        });
      };

      renderChemicalTypes(chemicalTypes);

      if (searchInput) {
        searchInput.addEventListener('input', () => {
          const searchTerm = searchInput.value.toLowerCase();
          const filteredTypes = chemicalTypes.filter(type => 
            type.name.toLowerCase().includes(searchTerm) ||
            (type.representativeCode && type.representativeCode.toLowerCase().includes(searchTerm))
          );
          renderChemicalTypes(filteredTypes);
        });
      }

    } catch (error) {
      showToast('Lỗi khi tải danh sách loại hóa chất: ' + error.message, 'error');
    }
  }

  /**
   * Handle editing a chemical type (placeholder)
   */
  handleEditChemicalType(id) {
    // This would typically open a modal pre-filled with the chemical type's data
    showToast(`Chức năng sửa loại hóa chất (ID: ${id}) chưa được triển khai.`, 'info');
    // Example: Populate and show the add/edit modal
    // const chemicalType = chemicalTypes.find(ct => ct.id === id);
    // if (chemicalType) {
    //   document.getElementById('new-chemical-type-name').value = chemicalType.name;
    //   // ... populate other fields ...
    //   document.getElementById('add-chemical-type-modal').classList.remove('hidden');
    //   // Change form submission to handle update
    // }
  }

  /**
   * Handle deleting a chemical type
   */
  async handleDeleteChemicalType(id) {
    if (confirm('Bạn có chắc chắn muốn xóa loại hóa chất này?')) {
      try {
        await api.deleteChemicalType(id);
        showToast('Xóa loại hóa chất thành công', 'success');
        this.loadChemicalsData(); // Refresh the list
        if (this.currentPage === 'dashboard') this.loadDashboardData(); // Refresh dashboard
      } catch (error) {
        showToast('Lỗi khi xóa loại hóa chất: ' + error.message, 'error');
      }
    }
  }
  
  /**
   * Handle submission of Add Chemical Type form
   */
  async handleAddChemicalTypeForm(event) {
    event.preventDefault();
    const name = document.getElementById('new-chemical-type-name').value.trim();
    const unit = document.getElementById('new-chemical-type-unit').value.trim();
    const barcodeType = document.getElementById('new-chemical-type-barcode-type').value;
    const representativeCode = document.getElementById('new-chemical-type-representative-code').value.trim();

    if (!name || !unit || !barcodeType) {
      showToast('Vui lòng nhập đầy đủ thông tin bắt buộc (Tên, Đơn vị, Kiểu mã vạch)', 'error');
      return;
    }
    if (barcodeType === 'Type2' && !representativeCode) {
        showToast('Vui lòng nhập Tiền tố cho hóa chất Kiểu 2', 'error');
        return;
    }
     if (barcodeType === 'Type1' && !representativeCode) {
        showToast('Vui lòng nhập Mã đại diện cho hóa chất Kiểu 1', 'error');
        return;
    }


    try {
      await api.createChemicalType({ name, unit, barcodeType, representativeCode });
      showToast('Thêm loại hóa chất thành công', 'success');
      document.getElementById('add-chemical-type-modal').classList.add('hidden');
      document.getElementById('add-chemical-type-form').reset();
      this.loadChemicalsData(); // Refresh the list
      if (this.currentPage === 'dashboard') this.loadDashboardData(); // Refresh dashboard
    } catch (error) {
      showToast('Lỗi khi thêm loại hóa chất: ' + error.message, 'error');
    }
  }

  /**
   * Load Chemical Stats page
   */
  async loadChemicalStatsPage() {
    const startDateInput = document.getElementById('chemical-stats-start-date');
    const endDateInput = document.getElementById('chemical-stats-end-date');
    const typeSelect = document.getElementById('chemical-stats-type');
    const departmentSelect = document.getElementById('chemical-stats-department');
    const userSelect = document.getElementById('chemical-stats-user');
    const lotInput = document.getElementById('chemical-stats-lot');
    const applyFiltersBtn = document.getElementById('apply-chemical-filters-btn');
    const resetFiltersBtn = document.getElementById('reset-chemical-filters-btn');

    // Stats summary elements
    const type1ImportedSpan = document.getElementById('chemical-total-type1-imported');
    const type1StockSpan = document.getElementById('chemical-total-type1-stock');
    const type2ImportedSpan = document.getElementById('chemical-total-type2-imported');
    const type2DistributedSpan = document.getElementById('chemical-total-type2-distributed');
    
    // Table for history
    const historyTable = document.getElementById('chemical-history-table');
    
    // Load chemical types for filter
    try {
      const chemicalTypes = await api.getChemicalTypes();
      typeSelect.innerHTML = '<option value="">Tất cả</option>';
      chemicalTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = type.name;
        typeSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Lỗi khi tải danh sách loại hóa chất:', error);
    }
    
    // Load departments for filter
    try {
      const departments = await api.getDepartments();
      departmentSelect.innerHTML = '<option value="">Tất cả</option>';
      departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.name;
        departmentSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Lỗi khi tải danh sách khoa:', error);
    }
    
    // Load users for filter
    try {
      const users = await api.getUsers();
      userSelect.innerHTML = '<option value="">Tất cả</option>';
      users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        userSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Lỗi khi tải danh sách người dùng:', error);
    }
    
    // Load stats with no filters initially
    await loadChemicalStats();
    
    // Apply filters button
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => {
        loadChemicalStats();
      });
    }
    
    // Reset filters button
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => {
        startDateInput.value = '';
        endDateInput.value = '';
        typeSelect.value = '';
        departmentSelect.value = '';
        userSelect.value = '';
        lotInput.value = '';
        loadChemicalStats();
      });
    }
    
    // Function to load stats with current filters
    async function loadChemicalStats() {
      const filters = {
        startDate: startDateInput.value || undefined,
        endDate: endDateInput.value || undefined,
        chemicalTypeId: typeSelect.value || undefined,
        departmentId: departmentSelect.value || undefined,
        userId: userSelect.value || undefined,
        batchId: lotInput.value.trim() || undefined
      };
      
      try {
        const stats = await api.getChemicalStats(filters);
        
        // Update summary stats
        if (type1ImportedSpan) type1ImportedSpan.textContent = stats.totalType1Imported || 0;
        if (type1StockSpan) type1StockSpan.textContent = stats.totalType1Stock || 0;
        if (type2ImportedSpan) type2ImportedSpan.textContent = stats.totalType2Imported || 0;
        if (type2DistributedSpan) type2DistributedSpan.textContent = stats.totalType2Distributed || 0;
        
        // Update history table
        if (historyTable) {
          historyTable.innerHTML = '';
          
          if (!stats.history || stats.history.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 8;
            cell.textContent = 'Không có lịch sử hoạt động';
            cell.className = 'text-center';
            row.appendChild(cell);
            historyTable.appendChild(row);
          } else {
            stats.history.forEach(record => {
              const row = document.createElement('tr');
              row.className = 'history-item';
              
              let actionText = translateAction(record.action);
              
              row.innerHTML = `
                <td>${new Date(record.createdAt).toLocaleString()}</td>
                <td>${actionText}</td>
                <td>${record.ChemicalType?.name || 'N/A'}</td>
                <td>${record.ChemicalType?.barcodeType || 'N/A'}</td>
                <td>${record.ChemicalItem ? record.ChemicalItem.barcode : (record.quantity ? `${record.quantity}` : 'N/A')}</td>
                <td>${record.batchId || 'N/A'}</td>
                <td>${record.Department?.name || record.recipientName || 'N/A'}</td>
                <td>${record.notes || ''}</td>
              `;
              historyTable.appendChild(row);
            });
          }
        }
      } catch (error) {
        showToast('Lỗi khi tải thống kê hóa chất: ' + error.message, 'error');
      }
    }
    
    // Helper function to translate action
    function translateAction(action) {
      switch (action) {
        case 'import': return 'Nhập kho';
        case 'distribute': return 'Phân phối';
        case 'return': return 'Thu hồi';
        default: return action;
      }
    }
  }
  
  /**
   * Load data for the Unknown Barcodes page
   */
  async loadUnknownBarcodesData() {
    const unknownBarcodesTable = document.getElementById('unknown-barcodes-table');
    if (!unknownBarcodesTable) return;

    try {
      const unknownBarcodes = await api.getUnknownBarcodes(); // Assuming API endpoint exists
      unknownBarcodesTable.innerHTML = '';

      if (unknownBarcodes.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4; // Barcode, Scan Time, User, Notes
        cell.textContent = 'Không có mã vạch không xác định nào được ghi nhận.';
        cell.className = 'text-center';
        row.appendChild(cell);
        unknownBarcodesTable.appendChild(row);
        return;
      }

      unknownBarcodes.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${log.barcode}</td>
          <td>${new Date(log.scanTime).toLocaleString()}</td>
          <td>${log.User ? log.User.name : 'N/A'}</td>
          <td>${log.notes || ''}</td>
        `;
        unknownBarcodesTable.appendChild(row);
      });
    } catch (error) {
      showToast('Lỗi khi tải danh sách mã vạch không xác định: ' + error.message, 'error');
    }
  }
}

// Create UI manager instance
const ui = new UIManager();
