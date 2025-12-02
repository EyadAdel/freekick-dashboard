import api from '../api.js';
import { toast } from 'react-toastify';

const BASE_URL = '/listing/venue-data/days-of-week/';

export const daysOfWeekService = {
    // GET /listing/venue-data/days-of-week/
    // Fetch list of all days
    getAll: async (params = {}) => {
        try {
            const response = await api.get(BASE_URL, { params });
            return response.data;
        } catch (error) {
            console.error("Error fetching days of week:", error);
            toast.error("Failed to load days of week.");
            throw error;
        }
    },

    // POST /listing/venue-data/days-of-week/
    // Create a new entry
    create: async (data) => {
        try {
            const response = await api.post(BASE_URL, data);
            toast.success("Created successfully!");
            return response.data;
        } catch (error) {
            console.error("Error creating entry:", error);
            toast.error("Failed to create entry.");
            throw error;
        }
    },

    // GET /listing/venue-data/days-of-week/{id}/
    // Fetch a single entry by ID
    getById: async (id) => {
        try {
            const response = await api.get(`${BASE_URL}${id}/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching ID ${id}:`, error);
            toast.error("Failed to load details.");
            throw error;
        }
    },

    // PUT /listing/venue-data/days-of-week/{id}/
    // Update an entire entry
    update: async (id, data) => {
        try {
            const response = await api.put(`${BASE_URL}${id}/`, data);
            toast.success("Updated successfully!");
            return response.data;
        } catch (error) {
            console.error(`Error updating ID ${id}:`, error);
            toast.error("Failed to update entry.");
            throw error;
        }
    },

    // PATCH /listing/venue-data/days-of-week/{id}/
    // Partially update an entry
    patch: async (id, data) => {
        try {
            const response = await api.patch(`${BASE_URL}${id}/`, data);
            toast.success("Updated successfully!");
            return response.data;
        } catch (error) {
            console.error(`Error patching ID ${id}:`, error);
            toast.error("Failed to update entry.");
            throw error;
        }
    },

    // DELETE /listing/venue-data/days-of-week/{id}/
    // Delete an entry
    delete: async (id) => {
        try {
            const response = await api.delete(`${BASE_URL}${id}/`);
            toast.success("Deleted successfully!");
            return response.data;
        } catch (error) {
            console.error(`Error deleting ID ${id}:`, error);
            toast.error("Failed to delete entry.");
            throw error;
        }
    }
};