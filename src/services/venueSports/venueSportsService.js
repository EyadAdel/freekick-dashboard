import api from '../api.js';
import { toast } from 'react-toastify';

// Updated BASE_URL to match the image endpoint
const BASE_URL = '/listing/venue-data/venue-types/';

export const venueSportsService = {
    /**
     * GET /listing/venue-data/venue-types/
     * Retrieve a list of venue types
     */
    getAll: async (params = {}) => {
        try {
            const response = await api.get(`${BASE_URL}?all_languages`, { params });
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch venue types');
            throw error;
        }
    },

    /**
     * POST /listing/venue-data/venue-types/
     * Create a new venue type
     */
    create: async (data) => {
        try {
            const response = await api.post(BASE_URL, data);
            toast.success('Venues type created successfully');
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create venue type');
            throw error;
        }
    },

    /**
     * GET /listing/venue-data/venue-types/{id}/
     * Retrieve a specific venue type by ID
     */
    getById: async (id) => {
        try {
            const response = await api.get(`${BASE_URL}${id}/`);
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch venue type details');
            throw error;
        }
    },

    /**
     * PUT /listing/venue-data/venue-types/{id}/
     * Update an entire venue type by ID
     */
    update: async (id, data) => {
        try {
            const response = await api.put(`${BASE_URL}${id}/`, data);
            toast.success('Venues type updated successfully');
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update venue type');
            throw error;
        }
    },

    /**
     * PATCH /listing/venue-data/venue-types/{id}/
     * Partially update a venue type by ID
     */
    patch: async (id, data) => {
        try {
            const response = await api.patch(`${BASE_URL}${id}/`, data);
            toast.success('Venues type updated successfully');
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update venue type');
            throw error;
        }
    },

    /**
     * DELETE /listing/venue-data/venue-types/{id}/
     * Remove a venue type
     */
    delete: async (id) => {
        try {
            const response = await api.delete(`${BASE_URL}${id}/`);
            toast.success('Venues type deleted successfully');
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete venue type');
            throw error;
        }
    },
};