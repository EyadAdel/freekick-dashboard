import api from '../api.js';
import { toast } from 'react-toastify';

const BASE_URL = '/listing/venue-data/add-ons/';

export const addonsService = {
    /**
     * Get all addons
     */
    getAll: async (params = {}) => {
        try {
            const response = await api.get(`${BASE_URL}?all_languages`, { params });
            return response.data;
        } catch (error) {
            console.error("Error fetching addons:", error);
            // Optional: Suppress toast on simple fetch errors to avoid UI clutter
            throw error;
        }
    },

    /**
     * Create a new addon
     */
    create: async (data) => {
        try {
            const response = await api.post(BASE_URL, data);
            toast.success("Addon created successfully");
            return response.data;
        } catch (error) {
            console.error("Error creating addon:", error);
            toast.error(error.response?.data?.detail || "Failed to create addon.");
            throw error;
        }
    },

    /**
     * Get a single addon by ID
     */
    getById: async (id) => {
        try {
            const response = await api.get(`${BASE_URL}${id}/`);
            return response.data;
        } catch (error) {
            console.error("Error fetching addon details:", error);
            toast.error("Failed to load addon details.");
            throw error;
        }
    },

    /**
     * Update an addon
     */
    update: async (id, data) => {
        try {
            const response = await api.patch(`${BASE_URL}${id}/`, data);
            toast.success("Addon updated successfully");
            return response.data;
        } catch (error) {
            console.error("Error updating addon:", error);
            toast.error(error.response?.data?.detail || "Failed to update addon.");
            throw error;
        }
    },

    /**
     * Delete an addon
     */
    delete: async (id) => {
        try {
            const response = await api.delete(`${BASE_URL}${id}/`);
            toast.success("Addon deleted successfully");
            return response.data;
        } catch (error) {
            console.error("Error deleting addon:", error);
            toast.error(error.response?.data?.detail || "Failed to delete addon.");
            throw error;
        }
    }
};