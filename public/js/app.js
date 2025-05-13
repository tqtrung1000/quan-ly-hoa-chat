/**
 * Main application entry point
 * 
 * This file initializes the application and orchestrates the interaction
 * between the API service, authentication, and UI components.
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're running in a development environment
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (isDevelopment) {
    // Set up mock data for development without backend
    setupMockData();
  }
  
  // App is already initialized by the individual component modules:
  // - api.js creates the 'api' instance
  // - auth.js creates the 'auth' instance
  // - ui.js creates the 'ui' instance
  
  console.log('Chemical Management System initialized'); // Updated name
});

/**
 * Set up mock data for development without backend connection
 * This allows the frontend to be tested without a running backend
 */
async function setupMockData() {
  const isConnected = await checkBackendConnection();
  
  if (isConnected) {
    console.log('Backend connection detected - will use real API.');
  } else {
    console.log('Backend not detected - setting up mock data.');
    setupApiMocks();
  }
}

/**
 * Check if backend is running and connected
 * @returns {Promise<boolean>} - Promise resolving to connection status
 */
async function checkBackendConnection() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    // Use a generic endpoint that should exist, like departments or a new health check endpoint
    const response = await fetch('/api/departments', { 
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }
    });
    
    clearTimeout(timeoutId);
    if (response.ok || response.status === 401) {
      return true; 
    }
    console.log(`Backend connection check received status: ${response.status}`);
    return false;
  } catch (error) {
    console.log('Backend connection check failed (exception):', error.message);
    return false;
  }
}

/**
 * Set up API mocks for development without backend
 */
function setupApiMocks() {
  // Mock data
  const mockData = {
    currentUser: null,
    departments: [
      { id: 'dept1', name: 'Khoa Xét Nghiệm', code: 'XN', description: 'Khoa Xét Nghiệm tổng hợp' },
      { id: 'dept2', name: 'Khoa Cấp Cứu', code: 'CC', description: 'Khoa Cấp Cứu' },
      { id: 'dept3', name: 'Khoa Nội', code: 'NOI', description: 'Khoa Nội tổng quát' }
    ],
    users: [
      { id: 'user1', name: 'admin', password: 'password', departmentId: 'dept1', isAdmin: true },
      { id: 'user2', name: 'user_xn', password: 'password', departmentId: 'dept1', isAdmin: false },
      { id: 'user3', name: 'user_cc', password: 'password', departmentId: 'dept2', isAdmin: false }
    ],
    chemicalTypes: [
      { id: 'ct1', name: 'OVB Đông máu', unit: 'lọ', barcodeType: 'Type1', representativeCode: '111432', stockQuantity: 50, stockQuantityType2: 0 },
      { id: 'ct2', name: 'PT Đông máu', unit: 'lọ', barcodeType: 'Type1', representativeCode: '123122', stockQuantity: 30, stockQuantityType2: 0 },
      { id: 'ct3', name: 'Chai cấy máu AR', unit: 'chai', barcodeType: 'Type2', representativeCode: 'AR', stockQuantity: 0, stockQuantityType2: 100 },
      { id: 'ct4', name: 'Diluent Tế bào', unit: 'bình', barcodeType: 'Type2', representativeCode: 'DIL', stockQuantity: 0, stockQuantityType2: 20 }
    ],
    chemicalItems: [ // For Type 2 distributed items
      { id: 'ci1', barcode: 'AR1234567', chemicalTypeId: 'ct3', status: 'distributed', distributionDate: new Date().toISOString(), currentDepartmentId: 'dept2', currentUserId: 'user3', recipientName: 'BN A' },
      { id: 'ci2', barcode: 'AR7654321', chemicalTypeId: 'ct3', status: 'distributed', distributionDate: new Date().toISOString(), currentDepartmentId: 'dept3', currentUserId: 'user_cc', recipientName: 'BN B' }
    ],
    chemicalHistory: [
      { id: 'ch1', action: 'import', chemicalTypeId: 'ct1', quantity: 50, userId: 'user1', createdAt: new Date().toISOString() },
      { id: 'ch2', action: 'import', chemicalTypeId: 'ct3', quantity: 100, userId: 'user1', createdAt: new Date().toISOString() },
      { id: 'ch3', action: 'distribute', chemicalTypeId: 'ct3', chemicalItemId: 'ci1', departmentId: 'dept2', userId: 'user2', recipientName: 'BN A', createdAt: new Date().toISOString() }
    ],
    unknownBarcodes: [
      { id: 'ub1', barcode: 'UNKNOWN123', scanTime: new Date().toISOString(), userId: 'user2', notes: 'Scanned at return' }
    ],
    batches: [] // Batch model might be less relevant now, or linked to ChemicalHistory for imports
  };

  // Helper to get department by ID
  const getDepartment = (id) => mockData.departments.find(d => d.id === id);
  const getUser = (id) => mockData.users.find(u => u.id === id);
  const getChemicalType = (id) => mockData.chemicalTypes.find(ct => ct.id === id);


  // Override API methods with mock implementations
  api.login = async (name, password) => {
    if (!name || !password) throw new Error('Tên đăng nhập và mật khẩu là bắt buộc');
    const user = mockData.users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (!user || user.password !== password) throw new Error('Invalid credentials'); // Mock: check password
    mockData.currentUser = { ...user, department: getDepartment(user.departmentId) };
    const token = `mock_token_${Math.random().toString(36).substring(2)}`;
    api.setAuthToken(token);
    return mockData.currentUser;
  };

  api.getUserProfile = async () => {
    if (!mockData.currentUser) throw new Error('Not authorized, no token');
    return mockData.currentUser;
  };

  api.getUsers = async () => {
    if (!mockData.currentUser) throw new Error('Not authorized');
    return mockData.users.map(u => ({ ...u, department: getDepartment(u.departmentId) }));
  };
  
  api.getDepartments = async () => mockData.departments;
  api.createDepartment = async (deptData) => {
    if (!mockData.currentUser || !mockData.currentUser.isAdmin) throw new Error('Not authorized as admin');
    if (!deptData.name || !deptData.code) throw new Error('Name and code are required');
    if (mockData.departments.some(d => d.name.toLowerCase() === deptData.name.toLowerCase() || d.code.toLowerCase() === deptData.code.toLowerCase())) {
      throw new Error('Department with this name or code already exists');
    }
    const newDept = { id: `dept${mockData.departments.length + 1}`, ...deptData };
    mockData.departments.push(newDept);
    return newDept;
  };
  api.searchDepartments = async (term) => {
    const searchTermLower = term.toLowerCase();
    return mockData.departments.filter(d => d.name.toLowerCase().includes(searchTermLower) || d.code.toLowerCase().includes(searchTermLower));
  };

  // ChemicalType Mocks
  api.getChemicalTypes = async () => mockData.chemicalTypes;
  api.createChemicalType = async (data) => {
    if (!mockData.currentUser || !mockData.currentUser.isAdmin) throw new Error('Not authorized as admin');
    const newChemicalType = { id: `ct${mockData.chemicalTypes.length + 1}`, stockQuantity: 0, stockQuantityType2: 0, ...data };
    mockData.chemicalTypes.push(newChemicalType);
    return newChemicalType;
  };
  api.updateChemicalType = async (id, data) => {
    if (!mockData.currentUser || !mockData.currentUser.isAdmin) throw new Error('Not authorized as admin');
    const index = mockData.chemicalTypes.findIndex(ct => ct.id === id);
    if (index === -1) throw new Error('Chemical type not found');
    mockData.chemicalTypes[index] = { ...mockData.chemicalTypes[index], ...data };
    return mockData.chemicalTypes[index];
  };
  api.deleteChemicalType = async (id) => {
    if (!mockData.currentUser || !mockData.currentUser.isAdmin) throw new Error('Not authorized as admin');
    const index = mockData.chemicalTypes.findIndex(ct => ct.id === id);
    if (index === -1) throw new Error('Chemical type not found');
    mockData.chemicalTypes.splice(index, 1);
    return { message: 'Xóa loại hóa chất thành công' };
  };

  // Chemical Actions Mocks
  api.importChemicals = async (data) => {
    const { chemicalTypeId, quantity, batchId, notes } = data;
    const chemicalType = getChemicalType(chemicalTypeId);
    if (!chemicalType) throw new Error('Không tìm thấy loại hóa chất');
    if (chemicalType.barcodeType === 'Type1') chemicalType.stockQuantity += quantity;
    else chemicalType.stockQuantityType2 += quantity;
    
    mockData.chemicalHistory.push({ 
      id: `ch${mockData.chemicalHistory.length + 1}`, 
      action: 'import', chemicalTypeId, quantity, userId: mockData.currentUser.id, 
      batchId, notes, createdAt: new Date().toISOString(),
      ChemicalType: chemicalType, User: mockData.currentUser
    });
    return { message: `Nhập ${quantity} ${chemicalType.unit} ${chemicalType.name} thành công` };
  };

  api.distributeChemicals = async (data) => {
    const { barcode, departmentId, recipientName, notes, quantity } = data; // quantity for Type1
    const department = getDepartment(departmentId);
    if (!department) throw new Error('Không tìm thấy khoa nhận');

    let chemicalType = mockData.chemicalTypes.find(ct => ct.barcodeType === 'Type1' && ct.representativeCode === barcode);
    if (chemicalType) { // Type 1
      if (!quantity || quantity <= 0) throw new Error('Vui lòng cung cấp số lượng cho hóa chất này');
      if (chemicalType.stockQuantity < quantity) throw new Error(`Số lượng tồn kho của ${chemicalType.name} không đủ`);
      chemicalType.stockQuantity -= quantity;
      mockData.chemicalHistory.push({
        id: `ch${mockData.chemicalHistory.length + 1}`, action: 'distribute', chemicalTypeId: chemicalType.id, quantity,
        departmentId, userId: mockData.currentUser.id, recipientName, notes, createdAt: new Date().toISOString(),
        ChemicalType: chemicalType, Department: department, User: mockData.currentUser
      });
      return { message: `Phân phối ${quantity} ${chemicalType.unit} ${chemicalType.name} thành công`, chemicalType, distributedQuantity: quantity };
    } else { // Type 2
      chemicalType = mockData.chemicalTypes.find(ct => ct.barcodeType === 'Type2' && barcode.startsWith(ct.representativeCode));
      if (!chemicalType) throw new Error(`Không tìm thấy loại hóa chất phù hợp với mã vạch ${barcode}`);
      if (chemicalType.stockQuantityType2 <= 0) throw new Error(`Hóa chất ${chemicalType.name} đã hết hàng`);
      
      let item = mockData.chemicalItems.find(ci => ci.barcode === barcode);
      if (item && (item.status === 'distributed' || item.status === 'lost')) throw new Error(`Chai/lọ với mã vạch ${barcode} đã được phân phối hoặc bị mất`);
      
      chemicalType.stockQuantityType2 -= 1;
      if (item && item.status === 'returned') {
        item.status = 'distributed';
        item.distributionDate = new Date().toISOString();
        item.currentDepartmentId = departmentId;
        item.recipientName = recipientName;
        item.notes = notes;
      } else {
        item = { 
          id: `ci${mockData.chemicalItems.length + 1}`, barcode, chemicalTypeId: chemicalType.id, status: 'distributed', 
          distributionDate: new Date().toISOString(), currentDepartmentId: departmentId, recipientName, notes,
          currentUserId: mockData.currentUser.id
        };
        mockData.chemicalItems.push(item);
      }
      mockData.chemicalHistory.push({
        id: `ch${mockData.chemicalHistory.length + 1}`, action: 'distribute', chemicalTypeId: chemicalType.id, chemicalItemId: item.id,
        departmentId, userId: mockData.currentUser.id, recipientName, notes, createdAt: new Date().toISOString(),
        ChemicalType: chemicalType, ChemicalItem: item, Department: department, User: mockData.currentUser
      });
      return { message: `Phân phối chai/lọ ${barcode} (${chemicalType.name}) thành công`, chemicalItem: item };
    }
  };

  api.returnChemicals = async (data) => {
    const { barcode, notes } = data;
    const item = mockData.chemicalItems.find(ci => ci.barcode === barcode && ci.status === 'distributed');
    if (item) {
      const chemicalType = getChemicalType(item.chemicalTypeId);
      item.status = 'returned';
      item.returnDate = new Date().toISOString();
      item.notes = notes;
      if (chemicalType) chemicalType.stockQuantityType2 += 1;
      
      mockData.chemicalHistory.push({
        id: `ch${mockData.chemicalHistory.length + 1}`, action: 'return', chemicalTypeId: item.chemicalTypeId, chemicalItemId: item.id,
        departmentId: item.currentDepartmentId, userId: mockData.currentUser.id, recipientName: item.recipientName, 
        notes, createdAt: new Date().toISOString(),
        ChemicalType: chemicalType, ChemicalItem: item, Department: getDepartment(item.currentDepartmentId), User: mockData.currentUser
      });
      return { message: `Thu hồi chai/lọ ${barcode} (${chemicalType ? chemicalType.name : 'Không rõ loại'}) thành công`, chemicalItem: item };
    } else {
      const newUnknown = { id: `ub${mockData.unknownBarcodes.length + 1}`, barcode, scanTime: new Date().toISOString(), userId: mockData.currentUser.id, notes };
      mockData.unknownBarcodes.push(newUnknown);
      throw new Error(`Không tìm thấy chai/lọ với mã vạch ${barcode} đang được phân phối. Mã vạch đã được ghi nhận.`);
    }
  };

  api.getChemicalHistory = async () => {
    // Simulate joining data for display
    return mockData.chemicalHistory.map(h => ({
        ...h,
        ChemicalType: getChemicalType(h.chemicalTypeId),
        ChemicalItem: h.chemicalItemId ? mockData.chemicalItems.find(ci => ci.id === h.chemicalItemId) : null,
        Department: h.departmentId ? getDepartment(h.departmentId) : null,
        User: getUser(h.userId)
    })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  };
  
  api.getUnknownBarcodes = async () => {
     return mockData.unknownBarcodes.map(ub => ({
        ...ub,
        User: getUser(ub.userId)
    })).sort((a,b) => new Date(b.scanTime) - new Date(a.scanTime));
  };

  // Remove old bottle/batch mocks if they exist in api object
  delete api.getBottles;
  delete api.getBottleByCode;
  delete api.createBottle;
  delete api.distributeBottles; // old one
  delete api.returnBottle; // old one
  delete api.getBatchInfo;
  delete api.getUnreturnedBottles;

  console.log('API mock setup complete for Chemical Management System');
}
