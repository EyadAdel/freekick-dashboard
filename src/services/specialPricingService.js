import api from './api.js';
import { toast } from 'react-toastify';

// Updated BASE_URL to match the image endpoint
const BASE_URL = '/venue/pitch/special-pricing/';

export const specialPricingService = {

    // GET: List all special pricings
    getAll: async (params = {}) => {
        try {
            const response = await api.get(BASE_URL, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching special pricing list:', error);
            toast.error('Failed to load special pricing data.');
            throw error;
        }
    },

    // POST: Create a new special pricing
    create: async (data) => {
        try {
            const response = await api.post(BASE_URL, data);
            toast.success('Special pricing created successfully!');
            return response.data;
        } catch (error) {
            console.error('Error creating special pricing:', error);
            toast.error(error.response?.data?.message || 'Failed to create special pricing.');
            throw error;
        }
    },

    // GET: Retrieve a specific special pricing by ID
    getById: async (id) => {
        try {
            const response = await api.get(`${BASE_URL}${id}/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching special pricing ${id}:`, error);
            toast.error('Failed to load pricing details.');
            throw error;
        }
    },

    // PUT: Update a special pricing (Full update)
    update: async (id, data) => {
        try {
            const response = await api.put(`${BASE_URL}${id}/`, data);
            toast.success('Special pricing updated successfully!');
            return response.data;
        } catch (error) {
            console.error(`Error updating special pricing ${id}:`, error);
            toast.error('Failed to update special pricing.');
            throw error;
        }
    },

    // PATCH: Partial update of a special pricing
    patch: async (id, data) => {
        try {
            const response = await api.patch(`${BASE_URL}${id}/`, data);
            toast.success('Special pricing updated successfully!');
            return response.data;
        } catch (error) {
            console.error(`Error patching special pricing ${id}:`, error);
            toast.error('Failed to update special pricing.');
            throw error;
        }
    },

    // DELETE: Remove a special pricing
    delete: async (id) => {
        try {
            const response = await api.delete(`${BASE_URL}${id}/`);
            toast.success('Special pricing deleted successfully.');
            return response.data;
        } catch (error) {
            console.error(`Error deleting special pricing ${id}:`, error);
            toast.error('Failed to delete special pricing.');
            throw error;
        }
    }
};