/**
 * API Service for handling all HTTP requests to the backend
 */
class ApiService {
  constructor() {
    this.baseUrl = '/api';
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Set the authentication token for future requests
   * @param {string} token - JWT token
   */
  setAuthToken(token) {
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete this.headers['Authorization'];
      localStorage.removeItem('token');
    }
  }

  /**
   * Initialize token from local storage if it exists
   */
  initializeToken() {
    const token = localStorage.getItem('token');
    if (token) {
      this.setAuthToken(token);
      return true;
    }
    return false;
  }

  /**
   * Generic request method
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {object} body - Request body (optional)
   * @returns {Promise} - Promise with response data
   */
  async request(endpoint, method = 'GET', body = null) {
    try {
      const options = {
        method,
        headers: this.headers,
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    const data = await this.request('/auth/login', 'POST', { email, password });
    if (data.token) {
      this.setAuthToken(data.token);
    }
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', 'POST', userData);
    if (data.token) {
      this.setAuthToken(data.token);
    }
    return data;
  }

  async getUserProfile() {
    return await this.request('/auth/profile');
  }

  async getUsers() {
    return await this.request('/auth/users');
  }

  // Department endpoints
  async getDepartments() {
    try {
      return await this.request('/departments');
    } catch (error) {
      // For registration form, return empty array if unauthorized
      if (error.message && error.message.includes('Not authorized')) {
        return [];
      }
      throw error;
    }
  }

  async getDepartmentById(id) {
    return await this.request(`/departments/${id}`);
  }

  async createDepartment(departmentData) {
    return await this.request('/departments', 'POST', departmentData);
  }

  async updateDepartment(id, departmentData) {
    return await this.request(`/departments/${id}`, 'PUT', departmentData);
  }

  async getUnreturnedBottles(departmentId) {
    return await this.request(`/departments/${departmentId}/unreturned`);
  }

  async searchDepartments(term) {
    return await this.request(`/departments/search/${term}`);
  }

  // Bottle endpoints
  async getBottles() {
    return await this.request('/bottles');
  }

  async getBottleByCode(code) {
    return await this.request(`/bottles/code/${code}`);
  }

  async createBottle(bottleData) {
    return await this.request('/bottles', 'POST', bottleData);
  }

  async distributeBottles(distributionData) {
    return await this.request('/bottles/distribute', 'POST', distributionData);
  }

  async returnBottle(returnData) {
    return await this.request('/bottles/return', 'POST', returnData);
  }

  async getBatchInfo(batchId) {
    return await this.request(`/bottles/batch/${batchId}`);
  }
}

// Export a single instance
const api = new ApiService();
