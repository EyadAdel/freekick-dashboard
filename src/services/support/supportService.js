import api from '../api.js';
import { toast } from 'react-toastify';

const BASE_URL = '/support/supportrequest/';

export const supportService = {
    /**
     * View all support requests
     * Endpoint: GET /support/supportrequest/?page=1&search=...
     */
    getAll: async (params = {}) => {
        try {
            // Pass params to the axios get request
            const response = await api.get(BASE_URL, { params });
            return response.data;
        } catch (error) {
            console.error("Error fetching support requests:", error);
            // Optional: prevent toast on 404 if it just means "no results found" during search
            if (error.response?.status !== 404) {
                toast.error(error.response?.data?.message || "Failed to fetch support requests.");
            }
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const response = await api.get(`${BASE_URL}${id}/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching support request ${id}:`, error);
            toast.error(error.response?.data?.message || "Failed to fetch support request details.");
            throw error;
        }
    },

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

    update: async (id, data) => {
        try {
            const response = await api.put(`${BASE_URL}${id}/`, data);
            toast.success("Support request updated successfully!");
            return response.data;
        } catch (error) {
            console.error(`Error updating support request ${id}:`, error);
            toast.error(error.response?.data?.message || "Failed to update support request.");
            throw error;
        }
    },

    delete: async (id) => {
        try {
            const response = await api.delete(`${BASE_URL}${id}/`);
            toast.success("Support request deleted successfully!");
            return response.data;
        } catch (error) {
            console.error(`Error deleting support request ${id}:`, error);
            toast.error(error.response?.data?.message || "Failed to delete support request.");
            throw error;
        }
    }
};