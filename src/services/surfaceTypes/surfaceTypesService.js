// src/services/surfaceTypes/surfaceTypesService.js
import api from '../api.js';
import { toast } from 'react-toastify';

const BASE_URL = '/listing/venue-data/surface-types/';

export const surfaceTypesService = {
    /**
     * Get all surface types with pagination and search
     * Endpoint: GET /listing/venue-data/surface-types/?page=1&page_limit=10&search=...
     */
    getAllSurfaceTypes: async (params = {}) => {
        try {
            // We pass params to axios which handles building the query string:
            // e.g. ?all_languages=true&page=1&page_limit=10&search=grass
            const response = await api.get(BASE_URL, {
                params: {
                    all_languages: true, // Keep this if your UI requires all translations
                    ...params
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching surface types:", error);
            // We usually don't toast on fetch in the service to avoid double-toasting
            // if the component also handles it, but you can add it if needed.
            throw error;
        }
    },

    /**
     * Get a single surface type by ID
     */
    getSurfaceTypeById: async (id) => {
        try {
            const response = await api.get(`${BASE_URL}${id}/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching surface type ${id}:`, error);
            toast.error("Failed to load surface type details");
            throw error;
        }
    },

    /**
     * Create a new surface type
     */
    createSurfaceType: async (data) => {
        try {
            const response = await api.post(BASE_URL, data);
            toast.success("Surface type created successfully");
            return response.data;
        } catch (error) {
            console.error("Error creating surface type:", error);
            const errorMsg = error.response?.data?.message || "Failed to create surface type";
            toast.error(errorMsg);
            throw error;
        }
    },

    /**
     * Update an existing surface type
     */
    updateSurfaceType: async (id, data) => {
        try {
            const response = await api.put(`${BASE_URL}${id}/`, data);
            toast.success("Surface type updated successfully");
            return response.data;
        } catch (error) {
            console.error(`Error updating surface type ${id}:`, error);
            const errorMsg = error.response?.data?.message || "Failed to update surface type";
            toast.error(errorMsg);
            throw error;
        }
    },

    /**
     * Delete a surface type
     */
    deleteSurfaceType: async (id) => {
        try {
            const response = await api.delete(`${BASE_URL}${id}/`);
            toast.success("Surface type deleted successfully");
            return response.data;
        } catch (error) {
            console.error(`Error deleting surface type ${id}:`, error);
            const errorMsg = error.response?.data?.message || "Failed to delete surface type";
            toast.error(errorMsg);
            throw error;
        }
    }
};