// src/api/batchManagementApi.js
import api from "./api";

const API_BASE_URL = "/admin/users";

// Batch CRUD operations
export const batchApi = {
  // Get all batches with pagination and search
  getAllBatches: async (params = {}) => {
    try {
      const response = await api.get(`${API_BASE_URL}/batches`, {
        params: {
          page: params.page || 0,
          size: 10, // Always 10 per page
          ...(params.name && { name: params.name }),
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new batch
  createBatch: async (batchData) => {
    try {
      const response = await api.post(`${API_BASE_URL}/create/batch`, batchData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Student operations
export const studentApi = {
  // Get students by batch ID with pagination and search
  getStudentsByBatch: async (batchId, params = {}) => {
    try {
      const response = await api.get(`${API_BASE_URL}/${batchId}/students`, {
        params: {
          page: params.page || 0,
          size: 10, // Always 10 per page
          ...(params.search && { search: params.search }),
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Check users before adding
  checkUsers: async (users) => {
    try {
      const response = await api.post(`${API_BASE_URL}/check-users`, users);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add multiple users to batch
  addUsersToBatch: async (batchId, usersData) => {
    try {
      const response = await api.post(
        `${API_BASE_URL}/candidate/${batchId}/multiple`,
        usersData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add existing users to batch (simplified version)
  addExistingUsersToBatch: async (batchId, users) => {
    try {
      const response = await api.post(
        `${API_BASE_URL}/candidate/${batchId}/multiple`,
        { users }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete student from batch
  deleteStudentFromBatch: async (batchId, userId) => {
    try {
      const response = await api.delete(`${API_BASE_URL}/batches/${batchId}/candidates/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add new users with invitations
  addNewUsersWithInvite: async (batchId, users, inviteExpiryHours) => {
    try {
      const response = await api.post(
        `${API_BASE_URL}/candidate/${batchId}/multiple`,
        {
          inviteExpiryHours: parseInt(inviteExpiryHours),
          role: "CANDIDATE",
          users: users
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Export all APIs together
const batchManagementApi = {
  batch: batchApi,
  student: studentApi
};

export default batchManagementApi;