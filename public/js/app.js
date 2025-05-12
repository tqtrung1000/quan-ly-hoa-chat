/**
 * Main application entry point
 * 
 * This file initializes the application and orchestrates the interaction
 * between the API service, authentication, and UI components.
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're running in a development environment without MongoDB
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (isDevelopment) {
    // Set up mock data for development without backend
    setupMockData();
  }
  
  // App is already initialized by the individual component modules:
  // - api.js creates the 'api' instance
  // - auth.js creates the 'auth' instance
  // - ui.js creates the 'ui' instance
  
  console.log('Blood Bottle Management System initialized');
});

/**
 * Set up mock data for development without backend connection
 * This allows the frontend to be tested without a running backend
 */
async function setupMockData() { // Made async
  // Check if backend is actually available FIRST
  const isConnected = await checkBackendConnection(); // Made await
  
  if (isConnected) {
    console.log('Backend connection detected - will use real API.');
    // Do NOT call setupApiMocks() if backend is connected
  } else {
    console.log('Backend not detected - setting up mock data.');
    setupApiMocks(); // Only setup mocks if backend is not connected
  }
}

/**
 * Check if backend is running and connected
 * @returns {Promise<boolean>} - Promise resolving to connection status
 */
async function checkBackendConnection() {
  try {
    // Try to fetch from backend with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch('/api/departments', { 
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }
    });
    
    clearTimeout(timeoutId);
    // If response is OK (2xx) or 401 (Unauthorized, but backend is alive), consider it connected for login purposes.
    // The actual API calls will handle auth properly.
    if (response.ok || response.status === 401) {
      return true; 
    }
    // For other errors (500, network issues), treat as not connected.
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
      { _id: 'dept1', name: 'Cardiology', code: 'CARD', bottlesOut: 5, description: 'Cardiology Department' },
      { _id: 'dept2', name: 'Neurology', code: 'NEUR', bottlesOut: 3, description: 'Neurology Department' },
      { _id: 'dept3', name: 'Pediatrics', code: 'PED', bottlesOut: 8, description: 'Pediatrics Department' },
      { _id: 'dept4', name: 'Emergency', code: 'ER', bottlesOut: 12, description: 'Emergency Room' },
      { _id: 'dept5', name: 'Laboratory', code: 'LAB', bottlesOut: 0, description: 'Main Laboratory' }
    ],
    users: [
      { _id: 'user1', name: 'Admin User', password: 'password', department: { _id: 'dept5', name: 'Laboratory', code: 'LAB' }, isAdmin: true }, // Reverted
      { _id: 'user2', name: 'John Doe', password: 'password', department: { _id: 'dept1', name: 'Cardiology', code: 'CARD' }, isAdmin: false }, // Reverted
      { _id: 'user3', name: 'Jane Smith', password: 'password', department: { _id: 'dept2', name: 'Neurology', code: 'NEUR' }, isAdmin: false }, // Reverted
      { _id: 'user4', name: 'Robert Johnson', password: 'password', department: { _id: 'dept3', name: 'Pediatrics', code: 'PED' }, isAdmin: false }, // Reverted
      { _id: 'user5', name: 'Sarah Lee', password: 'password', department: { _id: 'dept4', name: 'Emergency', code: 'ER' }, isAdmin: false } // Reverted
    ],
    bottles: [],
    batches: []
  };
  
  // Generate some bottle data
  for (let i = 1; i <= 50; i++) {
    const bottleCode = `BTL${String(i).padStart(4, '0')}`;
    const randomStatus = i % 5 === 0 ? 'distributed' : 'available';
    
    const bottle = {
      _id: `bottle${i}`,
      code: bottleCode,
      status: randomStatus,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString(),
      history: []
    };
    
    // If distributed, add department and batch info
    if (randomStatus === 'distributed') {
      const deptIndex = Math.floor(Math.random() * mockData.departments.length);
      const dept = mockData.departments[deptIndex];
      const user = mockData.users.find(u => u.department._id === dept._id) || mockData.users[0];
      
      const batchId = `BATCH-${Date.now() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000}-${Math.random().toString(36).substring(2, 7)}`;
      
      bottle.currentDepartment = dept;
      bottle.currentUser = user;
      bottle.batchId = batchId;
      
      // Add distribution history
      const distDate = new Date(Date.now() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000);
      
      bottle.history.push({
        action: 'distributed',
        timestamp: distDate.toISOString(),
        department: dept,
        user: user,
        batchId: batchId,
        notes: 'Mock distribution'
      });
      
      // Check if batch exists
      let batch = mockData.batches.find(b => b.batchId === batchId);
      
      if (!batch) {
        batch = {
          _id: `batch-${mockData.batches.length + 1}`,
          batchId,
          sourceDepartment: mockData.departments[4], // Lab
          targetDepartment: dept,
          distributedBy: mockData.users[0],
          receivedBy: user,
          bottles: [],
          bottleCount: 0,
          returnedCount: 0,
          status: 'active',
          notes: 'Mock batch',
          createdAt: distDate.toISOString(),
          updatedAt: distDate.toISOString()
        };
        
        mockData.batches.push(batch);
      }
      
      batch.bottles.push(bottle._id);
      batch.bottleCount++;
    }
    
    mockData.bottles.push(bottle);
  }

  // Override API methods with mock implementations
  api.login = async (name, password) => { // Reverted
    // Simple validation
    if (!name || !password) { 
      throw new Error('Tên đăng nhập và mật khẩu là bắt buộc'); 
    }
    
    // Find user by name
    const user = mockData.users.find(u => u.name.toLowerCase() === name.toLowerCase()); // Reverted
    
    if (!user) { // Mock: any password for found user is fine
      throw new Error('Invalid credentials');
    }
    
    // In mock mode, any password works
    mockData.currentUser = user;
    
    // Generate fake token
    const token = `mock_token_${Math.random().toString(36).substring(2)}`;
    api.setAuthToken(token);
    
    return user;
  };
  
  api.register = async (userData) => { // This mock function is no longer used as register is removed
    if (!userData.name || !userData.password || !userData.department) { // Reverted
      throw new Error('All fields are required');
    }
        
    // Find department
    const department = mockData.departments.find(d => d._id === userData.department);
    
    if (!department) {
      throw new Error('Invalid department');
    }
    
    const newUser = {
      _id: `user${mockData.users.length + 1}`,
      name: userData.name, // Reverted
      password: userData.password, // Reverted
      department: department,
      isAdmin: userData.isAdmin || false // Reverted
    };
    
    mockData.users.push(newUser);
    mockData.currentUser = newUser;
    
    const token = `mock_token_${Math.random().toString(36).substring(2)}`;
    api.setAuthToken(token);
    
    return newUser;
  };
  
  api.getUserProfile = async () => {
    if (!mockData.currentUser) {
      throw new Error('Not authorized, no token');
    }
    
    return mockData.currentUser;
  };
  
  api.getUsers = async () => {
    if (!mockData.currentUser) {
      throw new Error('Not authorized');
    }
    
    return mockData.users;
  };
  
  api.getDepartments = async () => {
    return mockData.departments;
  };
  
  api.getDepartmentById = async (id) => {
    const dept = mockData.departments.find(d => d._id === id);
    
    if (!dept) {
      throw new Error('Department not found');
    }
    
    return dept;
  };
  
  api.createDepartment = async (deptData) => {
    if (!mockData.currentUser || !mockData.currentUser.isAdmin) {
      throw new Error('Not authorized as admin');
    }
    
    if (!deptData.name || !deptData.code) {
      throw new Error('Name and code are required');
    }
    
    // Check for existing department
    if (mockData.departments.some(d => 
      d.name.toLowerCase() === deptData.name.toLowerCase() || 
      d.code.toLowerCase() === deptData.code.toLowerCase()
    )) {
      throw new Error('Department with this name or code already exists');
    }
    
    const newDept = {
      _id: `dept${mockData.departments.length + 1}`,
      name: deptData.name,
      code: deptData.code,
      description: deptData.description || '',
      bottlesOut: 0
    };
    
    mockData.departments.push(newDept);
    
    return newDept;
  };
  
  api.searchDepartments = async (term) => {
    const searchTermLower = term.toLowerCase();
    
    return mockData.departments.filter(d => 
      d.name.toLowerCase().includes(searchTermLower) || 
      d.code.toLowerCase().includes(searchTermLower)
    );
  };
  
  api.getUnreturnedBottles = async (departmentId) => {
    const dept = mockData.departments.find(d => d._id === departmentId);
    
    if (!dept) {
      throw new Error('Department not found');
    }
    
    const unreturnedBottles = mockData.bottles.filter(b => 
      b.currentDepartment && b.currentDepartment._id === departmentId && 
      b.status === 'distributed'
    );
    
    return {
      department: dept,
      unreturnedCount: unreturnedBottles.length,
      bottles: unreturnedBottles
    };
  };
  
  api.getBottles = async () => {
    return mockData.bottles;
  };
  
  api.getBottleByCode = async (code) => {
    const bottle = mockData.bottles.find(b => b.code === code);
    
    if (!bottle) {
      throw new Error('Bottle not found');
    }
    
    return bottle;
  };
  
  api.createBottle = async (bottleData) => {
    if (!mockData.currentUser || !mockData.currentUser.isAdmin) {
      throw new Error('Not authorized as admin');
    }
    
    if (!bottleData.code) {
      throw new Error('Bottle code is required');
    }
    
    // Check if bottle already exists
    if (mockData.bottles.some(b => b.code === bottleData.code)) {
      throw new Error('Bottle with this code already exists');
    }
    
    const newBottle = {
      _id: `bottle${mockData.bottles.length + 1}`,
      code: bottleData.code,
      status: 'available',
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockData.bottles.push(newBottle);
    
    return newBottle;
  };
  
  api.distributeBottles = async (distributionData) => {
    if (!mockData.currentUser) {
      throw new Error('Not authorized');
    }
    
    const { bottles: bottleCodes, departmentId, userId, notes } = distributionData;
    
    if (!bottleCodes || bottleCodes.length === 0) {
      throw new Error('No bottles provided for distribution');
    }
    
    const department = mockData.departments.find(d => d._id === departmentId);
    if (!department) {
      throw new Error('Department not found');
    }
    
    const user = mockData.users.find(u => u._id === userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate batch ID
    const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Create new batch
    const batch = {
      _id: `batch${mockData.batches.length + 1}`,
      batchId,
      sourceDepartment: mockData.currentUser.department,
      targetDepartment: department,
      distributedBy: mockData.currentUser,
      receivedBy: user,
      bottles: [],
      bottleCount: 0,
      returnedCount: 0,
      status: 'active',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Process bottles
    const results = [];
    
    for (const code of bottleCodes) {
      const bottle = mockData.bottles.find(b => b.code === code);
      
      if (!bottle) {
        results.push({ code, status: 'error', message: 'Bottle not found' });
        continue;
      }
      
      if (bottle.status !== 'available') {
        results.push({ code, status: 'error', message: 'Bottle is not available for distribution' });
        continue;
      }
      
      // Update bottle
      bottle.status = 'distributed';
      bottle.currentDepartment = department;
      bottle.currentUser = user;
      bottle.batchId = batchId;
      bottle.updatedAt = new Date().toISOString();
      
      // Add to history
      bottle.history.push({
        action: 'distributed',
        timestamp: new Date().toISOString(),
        department: department,
        user: user,
        batchId: batchId,
        notes: notes || ''
      });
      
      // Add to batch
      batch.bottles.push(bottle._id);
      batch.bottleCount++;
      
      // Update department count
      department.bottlesOut++;
      
      results.push({ code, status: 'success', bottle });
    }
    
    // Save batch
    mockData.batches.push(batch);
    
    return {
      batchId,
      results,
      successCount: results.filter(r => r.status === 'success').length,
      errorCount: results.filter(r => r.status === 'error').length,
    };
  };
  
  api.returnBottle = async (returnData) => {
    if (!mockData.currentUser) {
      throw new Error('Not authorized');
    }
    
    const { code, notes } = returnData;
    
    const bottle = mockData.bottles.find(b => b.code === code);
    if (!bottle) {
      throw new Error('Bottle not found');
    }
    
    if (bottle.status !== 'distributed') {
      throw new Error('Bottle is not currently distributed');
    }
    
    // Store department and batch ID before returning
    const departmentId = bottle.currentDepartment._id;
    const batchId = bottle.batchId;
    
    // Return the bottle
    bottle.status = 'available';
    const previousDepartment = bottle.currentDepartment;
    bottle.currentDepartment = null;
    bottle.currentUser = null;
    bottle.batchId = null;
    bottle.updatedAt = new Date().toISOString();
    
    // Add to history
    bottle.history.push({
      action: 'returned',
      timestamp: new Date().toISOString(),
      department: previousDepartment,
      user: mockData.currentUser,
      batchId: batchId,
      notes: notes || ''
    });
    
    // Update department count
    const department = mockData.departments.find(d => d._id === departmentId);
    if (department) {
      department.bottlesOut--;
    }
    
    // Update batch
    if (batchId) {
      const batch = mockData.batches.find(b => b.batchId === batchId);
      if (batch) {
        batch.returnedCount++;
        
        if (batch.returnedCount >= batch.bottleCount) {
          batch.status = 'completed';
        }
        
        batch.updatedAt = new Date().toISOString();
      }
    }
    
    return {
      message: 'Bottle returned successfully',
      bottle,
      batch: batchId ? mockData.batches.find(b => b.batchId === batchId) : null
    };
  };
  
  api.getBatchInfo = async (batchId) => {
    const batch = mockData.batches.find(b => b.batchId === batchId);
    
    if (!batch) {
      throw new Error('Batch not found');
    }
    
    // Populate bottles
    batch.bottles = batch.bottles.map(bottleId => {
      return mockData.bottles.find(b => b._id === bottleId);
    }).filter(Boolean);
    
    return batch;
  };
  
  console.log('API mock setup complete');
}
