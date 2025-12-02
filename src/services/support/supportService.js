import api from '../api.js';
import { toast } from 'react-toastify';

const BASE_URL = '/support/supportrequest/';

export const supportService = {
    /**
     * View all support requests
     * Endpoint: GET /support/supportrequest/
     */
    getAll: async () => {
        try {
            const response = await api.get(BASE_URL);
            return response.data;
        } catch (error) {
            console.error("Error fetching support requests:", error);
            toast.error(error.response?.data?.message || "Failed to fetch support requests.");
            throw error;
        }
    },

    /**
     * View one support request by ID
     * Endpoint: GET /support/supportrequest/{id}
     */
    getById: async (id) => {
        try {
            const response = await api.get(`${BASE_URL}${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching support request ${id}:`, error);
            toast.error(error.response?.data?.message || "Failed to fetch support request details.");
            throw error;
        }
    },

    /**
     * Create a new support request
     * Endpoint: POST /support/supportrequest/
     */
    create: async (data) => {
        try {
            const response = await api.post(BASE_URL, data);
            toast.success("Support request created successfully!");
            return response.data;
        } catch (error) {
            console.error("Error creating support request:", error);
            toast.error(error.response?.data?.message || "Failed to create support request.");
            throw error;
        }
    },

    /**
     * Update an existing support request
     * Endpoint: PUT /support/supportrequest/{id}
     */
    update: async (id, data) => {
        try {
            const response = await api.put(`${BASE_URL}${id}`, data);
            toast.success("Support request updated successfully!");
            return response.data;
        } catch (error) {
            console.error(`Error updating support request ${id}:`, error);
            toast.error(error.response?.data?.message || "Failed to update support request.");
            throw error;
        }
    },

    /**
     * Delete a support request
     * Endpoint: DELETE /support/supportrequest/{id}
     */
    delete: async (id) => {
        try {
            const response = await api.delete(`${BASE_URL}${id}`);
            toast.success("Support request deleted successfully!");
            return response.data;
        } catch (error) {
            console.error(`Error deleting support request ${id}:`, error);
            toast.error(error.response?.data?.message || "Failed to delete support request.");
            throw error;
        }
    }
};