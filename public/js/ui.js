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
    
    // Find all nav items
    this.navItems = document.querySelectorAll('.nav-item');
    
    // Set up navigation
    this.setupNavigation();
    
    // Initialize modals
    this.initializeModals();
    
    // Check if user is already authenticated
    if (auth && auth.isUserAuthenticated()) {
      // User is authenticated, navigate to dashboard
      this.navigateTo('dashboard');
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
    this.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const pageName = item.dataset.page;
        this.navigateTo(pageName);
      });
    });
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
      case 'distribute':
        this.initDistributePage();
        break;
      case 'return':
        this.initReturnPage();
        break;
      case 'departments':
        this.loadDepartmentsData();
        break;
      case 'bottles':
        this.loadBottlesData();
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
    
    // Set up specific modal triggers
    const addBottleBtn = document.getElementById('add-bottle-btn');
    if (addBottleBtn) {
      addBottleBtn.addEventListener('click', () => {
        document.getElementById('add-bottle-modal').classList.remove('hidden');
      });
    }
    
    // Set up add bottle form
    const addBottleForm = document.getElementById('add-bottle-form');
    if (addBottleForm) {
      addBottleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('new-bottle-code').value.trim();
        
        if (!code) {
          showToast('Vui lòng nhập mã chai', 'error');
          return;
        }
        
        try {
          await api.createBottle({ code });
          showToast('Thêm chai thành công', 'success');
          document.getElementById('add-bottle-modal').classList.add('hidden');
          document.getElementById('new-bottle-code').value = '';
          this.loadBottlesData();
        } catch (error) {
          showToast('Lỗi khi thêm chai: ' + error.message, 'error');
        }
      });
    }
  }
  
  /**
   * Load data for the dashboard
   */
  async loadDashboardData() {
    try {
      // Get overall counts
      const [bottles, departments] = await Promise.all([
        api.getBottles(),
        api.getDepartments()
      ]);
      
      const bottlesOut = bottles.filter(b => b.status === 'distributed').length;
      const bottlesAvailable = bottles.filter(b => b.status === 'available').length;
      
      // Update dashboard cards
      document.getElementById('bottles-out').textContent = bottlesOut;
      document.getElementById('bottles-available').textContent = bottlesAvailable;
      document.getElementById('department-count').textContent = departments.length;
      
      // For recent activity, we would typically need an activity log endpoint
      // For now, we'll simulate with bottle history data
      this.loadRecentActivity(bottles);
    } catch (error) {
      showToast('Lỗi khi tải dữ liệu bảng điều khiển: ' + error.message, 'error');
    }
  }
  
  /**
   * Load recent activity data
   * @param {Array} bottles - Bottle data from API
   */
  loadRecentActivity(bottles) {
    const activityTable = document.getElementById('recent-activity-table');
    if (!activityTable) return;
    
    activityTable.innerHTML = '';
    
    // Get bottles with history entries
    const bottlesWithHistory = bottles.filter(b => b.history && b.history.length > 0);
    
    // Extract and sort all history entries
    let allActivities = [];
    bottlesWithHistory.forEach(bottle => {
      bottle.history.forEach(historyItem => {
        allActivities.push({
          action: historyItem.action,
          department: historyItem.department?.name || 'Không xác định',
          batchId: historyItem.batchId,
          timestamp: new Date(historyItem.timestamp)
        });
      });
    });
    
    // Sort by timestamp, most recent first
    allActivities.sort((a, b) => b.timestamp - a.timestamp);
    
    // Group by batch ID to consolidate
    const batchGroups = {};
    allActivities.forEach(activity => {
      if (activity.batchId) {
        if (!batchGroups[activity.batchId]) {
          batchGroups[activity.batchId] = {
            action: activity.action,
            department: activity.department,
            batchId: activity.batchId,
            timestamp: activity.timestamp,
            count: 1
          };
        } else {
          batchGroups[activity.batchId].count++;
          // Keep most recent timestamp
          if (activity.timestamp > batchGroups[activity.batchId].timestamp) {
            batchGroups[activity.batchId].timestamp = activity.timestamp;
          }
        }
      }
    });
    
    // Convert batch groups back to array and combine with individual activities
    const groupedActivities = [
      ...Object.values(batchGroups),
      ...allActivities.filter(a => !a.batchId)
    ];
    
    // Sort again and take only the most recent 10
    groupedActivities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .forEach(activity => {
        const row = document.createElement('tr');
        
        const actionCell = document.createElement('td');
        // Translate action text
        let actionText = '';
        if (activity.action === 'distributed') {
          actionText = 'Đã phân phối';
        } else if (activity.action === 'returned') {
          actionText = 'Đã trả lại';
        } else {
          actionText = activity.action.charAt(0).toUpperCase() + activity.action.slice(1);
        }
        actionCell.textContent = actionText;
        
        const departmentCell = document.createElement('td');
        departmentCell.textContent = activity.department;
        
        const countCell = document.createElement('td');
        countCell.textContent = activity.count || 1;
        
        const dateCell = document.createElement('td');
        dateCell.textContent = activity.timestamp.toLocaleDateString() + ' ' + 
                              activity.timestamp.toLocaleTimeString();
        
        row.appendChild(actionCell);
        row.appendChild(departmentCell);
        row.appendChild(countCell);
        row.appendChild(dateCell);
        
        activityTable.appendChild(row);
      });
    
    if (activityTable.children.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 4;
      cell.textContent = 'Không có hoạt động gần đây';
      cell.className = 'text-center';
      row.appendChild(cell);
      activityTable.appendChild(row);
    }
  }
  
  /**
   * Initialize the distribute bottles page
   */
  initDistributePage() {
    const departmentSearch = document.getElementById('department-search');
    const departmentResults = document.getElementById('department-results');
    const selectedDepartment = document.getElementById('selected-department');
    const departmentIdInput = document.getElementById('distribute-department-id');
    const distributeForm = document.getElementById('distribute-form');
    const addBottleBtn = document.querySelector('.add-bottle-btn');
    const bottleInput = document.querySelector('.bottle-code-input');
    const bottleList = document.getElementById('bottle-list');
    const recipientSelect = document.getElementById('distribute-recipient');
    
    // Department search
    if (departmentSearch && departmentResults) {
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
            const noResults = document.createElement('div');
            noResults.textContent = 'Không tìm thấy khoa nào';
            noResults.className = 'search-item';
            departmentResults.appendChild(noResults);
            return;
          }
          
          departments.forEach(dept => {
            const item = document.createElement('div');
            item.textContent = `${dept.name} (${dept.code})`;
            item.className = 'search-item';
            item.dataset.id = dept._id;
            item.dataset.name = dept.name;
            item.dataset.code = dept.code;
            
            item.addEventListener('click', () => {
              selectedDepartment.textContent = `${dept.name} (${dept.code})`;
              departmentIdInput.value = dept._id;
              departmentSearch.value = '';
              departmentResults.innerHTML = '';
              
              // Load users for this department
              this.loadDepartmentUsers(dept._id, recipientSelect);
            });
            
            departmentResults.appendChild(item);
          });
        } catch (error) {
          console.error('Lỗi khi tìm kiếm khoa:', error);
        }
      });
      
      // Hide results when clicking outside
      document.addEventListener('click', (e) => {
        if (!departmentSearch.contains(e.target) && !departmentResults.contains(e.target)) {
          departmentResults.innerHTML = '';
        }
      });
    }
    
    // Bottle code addition
    if (addBottleBtn && bottleInput && bottleList) {
      addBottleBtn.addEventListener('click', () => {
        this.addBottleToList(bottleInput, bottleList);
      });
      
      bottleInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.addBottleToList(bottleInput, bottleList);
        }
      });
    }
    
    // Form submission
    if (distributeForm) {
      distributeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const departmentId = departmentIdInput.value;
        const userId = recipientSelect.value;
        const notes = document.getElementById('distribute-notes').value;
        
        // Get bottle codes from the list
        const bottleCodes = Array.from(bottleList.children).map(item => 
          item.dataset.code
        );
        
        if (!departmentId) {
          showToast('Vui lòng chọn khoa', 'error');
          return;
        }
        
        if (!userId) {
          showToast('Vui lòng chọn người nhận', 'error');
          return;
        }
        
        if (bottleCodes.length === 0) {
          showToast('Vui lòng thêm ít nhất một chai', 'error');
          return;
        }
        
        try {
          const result = await api.distributeBottles({
            departmentId,
            userId,
            bottles: bottleCodes,
            notes
          });
          
          showToast(`Đã phân phối thành công ${result.successCount} chai`, 'success');
          
          // Clear the form
          selectedDepartment.textContent = '';
          departmentIdInput.value = '';
          recipientSelect.innerHTML = '<option value="">Chọn Người Nhận</option>';
          bottleList.innerHTML = '';
          document.getElementById('distribute-notes').value = '';
          
          // Refresh dashboard if we're going back to it
          if (this.currentPage === 'dashboard') {
            this.loadDashboardData();
          }
        } catch (error) {
          showToast('Lỗi khi phân phối chai: ' + error.message, 'error');
        }
      });
    }
  }
  
  /**
   * Add a bottle code to the list
   * @param {HTMLElement} input - Input element for bottle code
   * @param {HTMLElement} list - List element for bottle codes
   */
  addBottleToList(input, list) {
    const code = input.value.trim();
    if (!code) return;
    
    // Check if code already exists in the list
    const existingItem = Array.from(list.children).find(item => 
      item.dataset.code === code
    );
    
    if (existingItem) {
      showToast('Mã chai này đã có trong danh sách', 'warning');
      input.value = '';
      input.focus();
      return;
    }
    
    const listItem = document.createElement('li');
    listItem.className = 'bottle-item';
    listItem.dataset.code = code;
    
    listItem.innerHTML = `
      <span>${code}</span>
      <i class="fas fa-times remove-bottle"></i>
    `;
    
    // Add remove functionality
    const removeBtn = listItem.querySelector('.remove-bottle');
    removeBtn.addEventListener('click', () => {
      listItem.remove();
    });
    
    list.appendChild(listItem);
    input.value = '';
    input.focus();
  }
  
  /**
   * Load users for a specific department
   * @param {string} departmentId - Department ID
   * @param {HTMLElement} selectElement - Select element to populate
   */
  async loadDepartmentUsers(departmentId, selectElement) {
    if (!selectElement) return;
    
    // Clear existing options except for the placeholder
    while (selectElement.options.length > 1) {
      selectElement.remove(1);
    }
    
    try {
      const users = await api.getUsers();
      
      // Filter users by department
      const departmentUsers = users.filter(user => 
        user.department && user.department._id === departmentId
      );
      
      if (departmentUsers.length === 0) {
        const option = document.createElement('option');
        option.text = 'Không tìm thấy người dùng nào cho khoa này';
        option.disabled = true;
        selectElement.add(option);
        return;
      }
      
      departmentUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user._id;
        option.text = user.name;
        selectElement.add(option);
      });
    } catch (error) {
      showToast('Lỗi khi tải người dùng khoa: ' + error.message, 'error');
    }
  }
  
  /**
   * Initialize the return bottles page
   */
  initReturnPage() {
    const scanButton = document.getElementById('scan-return-bottle');
    const codeInput = document.getElementById('return-bottle-code');
    const bottleInfo = document.getElementById('bottle-info');
    const batchInfo = document.getElementById('batch-info');
    const returnBottleBtn = document.getElementById('return-bottle-btn');
    
    // Scan/lookup bottle
    if (scanButton && codeInput) {
      const scanBottle = async () => {
        const code = codeInput.value.trim();
        
        if (!code) {
          showToast('Vui lòng nhập mã chai', 'error');
          return;
        }
        
        try {
          const bottle = await api.getBottleByCode(code);
          
          // Display bottle info
          this.displayBottleInfo(bottle);
          bottleInfo.classList.remove('hidden');
          
          // Get batch info if available
          if (bottle.batchId) {
            try {
              const batch = await api.getBatchInfo(bottle.batchId);
              this.displayBatchInfo(batch);
              batchInfo.classList.remove('hidden');
            } catch (error) {
              console.error('Lỗi khi tải thông tin lô:', error);
              batchInfo.classList.add('hidden');
            }
          } else {
            batchInfo.classList.add('hidden');
          }
        } catch (error) {
          showToast('Lỗi khi tra cứu chai: ' + error.message, 'error');
          bottleInfo.classList.add('hidden');
          batchInfo.classList.add('hidden');
        }
      };
      
      scanButton.addEventListener('click', scanBottle);
      
      codeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          scanBottle();
        }
      });
    }
    
    // Return bottle
    if (returnBottleBtn) {
      returnBottleBtn.addEventListener('click', async () => {
        const code = codeInput.value.trim();
        const notes = document.getElementById('return-notes').value;
        
        if (!code) {
          showToast('Không có mã chai để trả lại', 'error');
          return;
        }
        
        try {
          await api.returnBottle({ code, notes });
          showToast('Trả chai thành công', 'success');
          
          // Reset form
          codeInput.value = '';
          document.getElementById('return-notes').value = '';
          bottleInfo.classList.add('hidden');
          batchInfo.classList.add('hidden');
          
          // Refresh dashboard if we're going back to it
          if (this.currentPage === 'dashboard') {
            this.loadDashboardData();
          }
        } catch (error) {
          showToast('Lỗi khi trả chai: ' + error.message, 'error');
        }
      });
    }
  }
  
  /**
   * Display bottle information in the UI
   * @param {object} bottle - Bottle data from API
   */
  displayBottleInfo(bottle) {
    document.getElementById('bottle-info-code').textContent = bottle.code;
    document.getElementById('bottle-info-department').textContent = 
      bottle.currentDepartment?.name || 'N/A';
    document.getElementById('bottle-info-user').textContent = 
      bottle.currentUser?.name || 'N/A';
    document.getElementById('bottle-info-batch').textContent = 
      bottle.batchId || 'N/A';
    
    // Find last distribution date
    const lastDist = bottle.history?.find(h => h.action === 'distributed');
    document.getElementById('bottle-info-date').textContent = 
      lastDist ? new Date(lastDist.timestamp).toLocaleString() : 'N/A';
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
          
          const bottlesOutCell = document.createElement('td');
          bottlesOutCell.textContent = dept.bottlesOut;
          
          const actionsCell = document.createElement('td');
          actionsCell.className = 'action-cell';
          
          const viewButton = document.createElement('button');
          viewButton.className = 'btn btn-sm';
          viewButton.textContent = 'Xem';
          viewButton.addEventListener('click', () => {
            this.showDepartmentDetails(dept._id);
          });
          
          actionsCell.appendChild(viewButton);
          
          // Add edit button for admins
          if (auth.isAdmin()) {
            const editButton = document.createElement('button');
            editButton.className = 'btn btn-sm btn-outline';
            editButton.textContent = 'Sửa';
            editButton.addEventListener('click', () => {
              // Edit functionality would be implemented here
              showToast('Chức năng sửa chưa được triển khai', 'info');
            });
            actionsCell.appendChild(editButton);
          }
          
          row.appendChild(nameCell);
          row.appendChild(codeCell);
          row.appendChild(bottlesOutCell);
          row.appendChild(actionsCell);
          
          departmentsTable.appendChild(row);
        });
      };
      
      // Initial render
      renderDepartments(departments);
      
      // Add search filter functionality
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
    const bottlesTable = document.getElementById('unreturned-bottles-table');
    
    if (!modal || !content || !bottlesTable) return;
    
    try {
      const unreturnedData = await api.getUnreturnedBottles(departmentId);
      
      content.innerHTML = `
        <div class="info-row">
          <span class="info-label">Tên:</span>
          <span class="info-value">${unreturnedData.department.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Mã:</span>
          <span class="info-value">${unreturnedData.department.code}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Chai Chưa Trả:</span>
          <span class="info-value">${unreturnedData.unreturnedCount}</span>
        </div>
      `;
      
      bottlesTable.innerHTML = '';
      
      if (unreturnedData.bottles.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 3;
        cell.textContent = 'Không có chai chưa trả';
        cell.className = 'text-center';
        row.appendChild(cell);
        bottlesTable.appendChild(row);
      } else {
        unreturnedData.bottles.forEach(bottle => {
          const row = document.createElement('tr');
          
          const codeCell = document.createElement('td');
          codeCell.textContent = bottle.code;
          
          const batchCell = document.createElement('td');
          batchCell.textContent = bottle.batchId || 'N/A';
          
          const dateCell = document.createElement('td');
          const lastDist = bottle.history?.find(h => h.action === 'distributed');
          dateCell.textContent = lastDist 
            ? new Date(lastDist.timestamp).toLocaleString()
            : 'N/A';
          
          row.appendChild(codeCell);
          row.appendChild(batchCell);
          row.appendChild(dateCell);
          
          bottlesTable.appendChild(row);
        });
      }
      
      modal.classList.remove('hidden');
    } catch (error) {
      showToast('Lỗi khi tải chi tiết khoa: ' + error.message, 'error');
    }
  }
  
  /**
   * Load bottles data for the bottles management page
   */
  async loadBottlesData() {
    const bottlesTable = document.getElementById('bottles-table');
    const statusFilter = document.getElementById('bottle-status-filter');
    const searchInput = document.getElementById('bottle-search');
    
    if (!bottlesTable) return;
    
    try {
      const bottles = await api.getBottles();
      
      const renderBottles = (filteredBottles) => {
        bottlesTable.innerHTML = '';
        
        if (filteredBottles.length === 0) {
          const row = document.createElement('tr');
          const cell = document.createElement('td');
          cell.colSpan = 5;
          cell.textContent = 'Không tìm thấy chai nào';
          cell.className = 'text-center';
          row.appendChild(cell);
          bottlesTable.appendChild(row);
          return;
        }
        
        filteredBottles.forEach(bottle => {
          const row = document.createElement('tr');
          
          const codeCell = document.createElement('td');
          codeCell.textContent = bottle.code;
          
          const statusCell = document.createElement('td');
          // Translate status
          let statusText = '';
          if (bottle.status === 'available') {
            statusText = 'Khả dụng';
          } else if (bottle.status === 'distributed') {
            statusText = 'Đã phân phối';
          } else if (bottle.status === 'returned') {
            statusText = 'Đã trả lại';
          } else {
            statusText = bottle.status.charAt(0).toUpperCase() + bottle.status.slice(1);
          }
          statusCell.textContent = statusText;
          
          // Add status colors
          if (bottle.status === 'available') {
            statusCell.classList.add('text-success');
          } else if (bottle.status === 'distributed') {
            statusCell.classList.add('text-warning');
          }
          
          const deptCell = document.createElement('td');
          deptCell.textContent = bottle.currentDepartment?.name || 'N/A';
          
          const batchCell = document.createElement('td');
          batchCell.textContent = bottle.batchId || 'N/A';
          
          const dateCell = document.createElement('td');
          dateCell.textContent = new Date(bottle.updatedAt).toLocaleString();
          
          row.appendChild(codeCell);
          row.appendChild(statusCell);
          row.appendChild(deptCell);
          row.appendChild(batchCell);
          row.appendChild(dateCell);
          
          bottlesTable.appendChild(row);
        });
      };
      
      // Initial render
      renderBottles(bottles);
      
      // Add filter functionality
      if (statusFilter && searchInput) {
        const applyFilters = () => {
          const statusValue = statusFilter.value;
          const searchValue = searchInput.value.toLowerCase();
          
          let filtered = [...bottles];
          
          // Apply status filter
          if (statusValue !== 'all') {
            filtered = filtered.filter(b => b.status === statusValue);
          }
          
          // Apply search filter
          if (searchValue) {
            filtered = filtered.filter(b => 
              b.code.toLowerCase().includes(searchValue)
            );
          }
          
          renderBottles(filtered);
        };
        
        statusFilter.addEventListener('change', applyFilters);
        searchInput.addEventListener('input', applyFilters);
      }
    } catch (error) {
      showToast('Lỗi khi tải danh sách chai: ' + error.message, 'error');
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
        cell.colSpan = 4;
        cell.textContent = 'Không tìm thấy người dùng nào';
        cell.className = 'text-center';
        row.appendChild(cell);
        usersTable.appendChild(row);
        return;
      }
      
      users.forEach(user => {
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = user.name;
        
        const emailCell = document.createElement('td');
        emailCell.textContent = user.email;
        
        const deptCell = document.createElement('td');
        deptCell.textContent = user.department?.name || 'N/A';
        
        const roleCell = document.createElement('td');
        roleCell.textContent = user.isAdmin ? 'Quản trị viên' : 'Người dùng';
        
        row.appendChild(nameCell);
        row.appendChild(emailCell);
        row.appendChild(deptCell);
        row.appendChild(roleCell);
        
        usersTable.appendChild(row);
      });
    } catch (error) {
      showToast('Lỗi khi tải danh sách người dùng: ' + error.message, 'error');
    }
  }
}

// Create UI manager instance
const ui = new UIManager();
